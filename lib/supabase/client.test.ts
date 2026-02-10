import { describe, it, expect, vi } from "vitest";

const mockCreateBrowserClient = vi.fn().mockReturnValue({
  auth: { getUser: vi.fn() },
});

vi.mock("@supabase/ssr", () => ({
  createBrowserClient: (...args: unknown[]) => mockCreateBrowserClient(...args),
}));

process.env.NEXT_PUBLIC_SUPABASE_URL = "http://localhost:54321";
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "test-anon-key";

const { createClient } = await import("./client");

describe("createClient (browser)", () => {
  it("creates a browser client with env vars", () => {
    const client = createClient();
    expect(mockCreateBrowserClient).toHaveBeenCalledWith(
      "http://localhost:54321",
      "test-anon-key",
    );
    expect(client).toBeDefined();
  });
});
