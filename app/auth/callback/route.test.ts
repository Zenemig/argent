import { describe, it, expect, vi, beforeEach } from "vitest";

const mockExchangeCodeForSession = vi.fn();

vi.mock("@/lib/supabase/server", () => ({
  createClient: () =>
    Promise.resolve({
      auth: {
        exchangeCodeForSession: (...args: unknown[]) =>
          mockExchangeCodeForSession(...args),
      },
    }),
}));

const { GET } = await import("./route");

describe("GET /auth/callback", () => {
  beforeEach(() => vi.clearAllMocks());

  it("exchanges code and redirects to / on success", async () => {
    mockExchangeCodeForSession.mockResolvedValue({ error: null });
    const request = new Request(
      "http://localhost:3000/auth/callback?code=test-code-123",
    );
    const response = await GET(request);

    expect(mockExchangeCodeForSession).toHaveBeenCalledWith("test-code-123");
    expect(response.status).toBe(307);
    expect(new URL(response.headers.get("location")!).pathname).toBe("/");
  });

  it("redirects to /login when exchange fails", async () => {
    mockExchangeCodeForSession.mockResolvedValue({
      error: { message: "Invalid code" },
    });
    const request = new Request(
      "http://localhost:3000/auth/callback?code=bad-code",
    );
    const response = await GET(request);

    expect(response.status).toBe(307);
    expect(new URL(response.headers.get("location")!).pathname).toBe("/login");
  });

  it("redirects to /login when no code param", async () => {
    const request = new Request("http://localhost:3000/auth/callback");
    const response = await GET(request);

    expect(mockExchangeCodeForSession).not.toHaveBeenCalled();
    expect(response.status).toBe(307);
    expect(new URL(response.headers.get("location")!).pathname).toBe("/login");
  });
});
