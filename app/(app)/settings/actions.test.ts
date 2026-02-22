import { describe, it, expect, vi, beforeEach } from "vitest";

const mockSignOut = vi.fn();
const mockRedirect = vi.fn();
const mockGetUser = vi.fn();
const mockInsert = vi.fn();
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
        insert: (...args: unknown[]) => mockInsert(...args),
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
    expect(mockInsert).not.toHaveBeenCalled();
  });

  it("inserts email and returns success", async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: "user-1", email: "test@example.com" } },
    });
    mockInsert.mockResolvedValue({ error: null });
    const result = await joinWaitlist();
    expect(mockInsert).toHaveBeenCalledWith({ email: "test@example.com" });
    expect(result).toEqual({ success: true });
  });

  it("treats duplicate (23505) as success", async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: "user-1", email: "test@example.com" } },
    });
    mockInsert.mockResolvedValue({
      error: { code: "23505", message: "unique_violation" },
    });
    const result = await joinWaitlist();
    expect(result).toEqual({ success: true });
    expect(mockTrackEvent).toHaveBeenCalled();
  });

  it("returns error when insert fails with non-duplicate error", async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: "user-1", email: "test@example.com" } },
    });
    mockInsert.mockResolvedValue({ error: { code: "42501", message: "RLS" } });
    const result = await joinWaitlist();
    expect(result).toEqual({ error: "failed" });
    expect(mockTrackEvent).not.toHaveBeenCalled();
  });

  it("tracks joined_waitlist event on success", async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: "user-1", email: "test@example.com" } },
    });
    mockInsert.mockResolvedValue({ error: null });
    await joinWaitlist();
    expect(mockTrackEvent).toHaveBeenCalled();
  });
});
