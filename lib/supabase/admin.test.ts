import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

const mockCreateClient = vi.fn().mockReturnValue({ auth: { admin: {} } });

vi.mock("@supabase/supabase-js", () => ({
  createClient: (...args: unknown[]) => mockCreateClient(...args),
}));

describe("createAdminClient", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.resetModules();
    mockCreateClient.mockClear();
    process.env = {
      ...originalEnv,
      NEXT_PUBLIC_SUPABASE_URL: "https://test.supabase.co",
      SUPABASE_SERVICE_ROLE_KEY: "test-service-role-key",
    };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it("creates a Supabase client with service role key", async () => {
    const { createAdminClient } = await import("./admin");
    createAdminClient();

    expect(mockCreateClient).toHaveBeenCalledWith(
      "https://test.supabase.co",
      "test-service-role-key",
      expect.objectContaining({
        auth: expect.objectContaining({
          autoRefreshToken: false,
          persistSession: false,
        }),
      }),
    );
  });

  it("throws when SUPABASE_SERVICE_ROLE_KEY is missing", async () => {
    delete process.env.SUPABASE_SERVICE_ROLE_KEY;
    const { createAdminClient } = await import("./admin");

    expect(() => createAdminClient()).toThrow("SUPABASE_SERVICE_ROLE_KEY");
  });
});
