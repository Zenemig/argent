import { describe, it, expect, vi, beforeEach } from "vitest";

const mockSignOut = vi.fn();
const mockRedirect = vi.fn();

vi.mock("next/navigation", () => ({
  redirect: (...args: unknown[]) => mockRedirect(...args),
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: () =>
    Promise.resolve({
      auth: { signOut: (...args: unknown[]) => mockSignOut(...args) },
    }),
}));

const { signOut } = await import("./actions");

describe("signOut", () => {
  beforeEach(() => vi.clearAllMocks());

  it("calls supabase.auth.signOut and redirects to /login", async () => {
    mockSignOut.mockResolvedValue({ error: null });
    await signOut();
    expect(mockSignOut).toHaveBeenCalled();
    expect(mockRedirect).toHaveBeenCalledWith("/login");
  });
});
