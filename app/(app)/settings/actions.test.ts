import { describe, it, expect, vi, beforeEach } from "vitest";

const mockSignOut = vi.fn();
const mockRedirect = vi.fn();
const mockGetUser = vi.fn();
const mockUpsert = vi.fn();
const mockTrackEvent = vi.fn().mockResolvedValue(undefined);

vi.mock("next/navigation", () => ({
  redirect: (...args: unknown[]) => mockRedirect(...args),
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: () =>
    Promise.resolve({
      auth: {
        signOut: (...args: unknown[]) => mockSignOut(...args),
        getUser: () => mockGetUser(),
      },
      from: () => ({
        upsert: (...args: unknown[]) => mockUpsert(...args),
      }),
    }),
}));

vi.mock("@/lib/analytics/track-event.server", () => ({
  trackEventServer: (...args: unknown[]) => mockTrackEvent(...args),
}));

const { signOut, joinWaitlist } = await import("./actions");

describe("signOut", () => {
  beforeEach(() => vi.clearAllMocks());

  it("calls supabase.auth.signOut and redirects to /login", async () => {
    mockSignOut.mockResolvedValue({ error: null });
    await signOut();
    expect(mockSignOut).toHaveBeenCalled();
    expect(mockRedirect).toHaveBeenCalledWith("/login");
  });
});

describe("joinWaitlist", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns error when user is not authenticated", async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } });
    const result = await joinWaitlist();
    expect(result).toEqual({ error: "notAuthenticated" });
    expect(mockUpsert).not.toHaveBeenCalled();
  });

  it("upserts with ignoreDuplicates and returns success", async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: "user-1", email: "test@example.com" } },
    });
    mockUpsert.mockResolvedValue({ error: null });
    const result = await joinWaitlist();
    expect(mockUpsert).toHaveBeenCalledWith(
      { email: "test@example.com" },
      { onConflict: "email", ignoreDuplicates: true },
    );
    expect(result).toEqual({ success: true });
  });

  it("returns error when upsert fails", async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: "user-1", email: "test@example.com" } },
    });
    mockUpsert.mockResolvedValue({ error: { message: "RLS" } });
    const result = await joinWaitlist();
    expect(result).toEqual({ error: "failed" });
    expect(mockTrackEvent).not.toHaveBeenCalled();
  });

  it("tracks joined_waitlist event on success", async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: "user-1", email: "test@example.com" } },
    });
    mockUpsert.mockResolvedValue({ error: null });
    await joinWaitlist();
    expect(mockTrackEvent).toHaveBeenCalled();
  });
});
