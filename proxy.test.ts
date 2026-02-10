import { describe, it, expect, vi, beforeEach } from "vitest";

// ---------- mocks ----------

const mockGetUser = vi.fn();
const mockIntlMiddleware = vi.fn();

vi.mock("@supabase/ssr", () => ({
  createServerClient: vi.fn(() => ({
    auth: { getUser: mockGetUser },
  })),
}));

vi.mock("next-intl/middleware", () => ({
  default: vi.fn(() => mockIntlMiddleware),
}));

vi.mock("./i18n/routing", () => ({
  routing: {
    locales: ["en", "es"],
    defaultLocale: "en",
    localePrefix: "as-needed",
  },
}));

// Set env vars before import
process.env.NEXT_PUBLIC_SUPABASE_URL = "http://localhost:54321";
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "test-anon-key";

// Use dynamic import so mocks are applied first
const { NextRequest, NextResponse } = await import("next/server");
const { default: proxy } = await import("./proxy");

// ---------- helpers ----------

function mockIntlResponse() {
  const response = NextResponse.next();
  mockIntlMiddleware.mockReturnValue(response);
  return response;
}

// ---------- tests ----------

describe("proxy", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetUser.mockResolvedValue({ data: { user: null } });
  });

  describe("app routes pass through without intl middleware", () => {
    it.each(["/gear", "/settings", "/roll/abc123", "/login", "/stats"])(
      "%s",
      async (path) => {
        const req = new NextRequest(`http://localhost:3000${path}`);
        const response = await proxy(req);
        expect(mockIntlMiddleware).not.toHaveBeenCalled();
        expect(response).toBeDefined();
      },
    );
  });

  describe("marketing routes go through intl middleware", () => {
    it.each(["/", "/pricing", "/es", "/es/pricing"])(
      "%s",
      async (path) => {
        mockIntlResponse();
        const req = new NextRequest(`http://localhost:3000${path}`);
        await proxy(req);
        expect(mockIntlMiddleware).toHaveBeenCalled();
      },
    );
  });

  describe("authenticated user on landing page", () => {
    beforeEach(() => {
      mockGetUser.mockResolvedValue({
        data: { user: { id: "user-123" } },
      });
    });

    it("skips intl middleware for / when authenticated", async () => {
      const req = new NextRequest("http://localhost:3000/");
      await proxy(req);
      expect(mockIntlMiddleware).not.toHaveBeenCalled();
    });

    it("skips intl middleware for /es when authenticated", async () => {
      const req = new NextRequest("http://localhost:3000/es");
      await proxy(req);
      expect(mockIntlMiddleware).not.toHaveBeenCalled();
    });

    it("still routes /pricing through intl middleware when authenticated", async () => {
      mockIntlResponse();
      const req = new NextRequest("http://localhost:3000/pricing");
      await proxy(req);
      expect(mockIntlMiddleware).toHaveBeenCalled();
    });
  });

  it("carries Supabase cookies onto intl response", async () => {
    const intlResponse = mockIntlResponse();
    const req = new NextRequest("http://localhost:3000/pricing");

    // Simulate supabase setting a cookie via the createServerClient setAll callback
    const { createServerClient } = await import("@supabase/ssr");
    const mockCSC = vi.mocked(createServerClient);
    mockCSC.mockImplementation((_url, _key, { cookies } = {} as never) => {
      // Call setAll to simulate Supabase refreshing auth
      (cookies as { setAll: (c: { name: string; value: string; options: object }[]) => void }).setAll([
        { name: "sb-token", value: "refreshed-jwt", options: { path: "/" } },
      ]);
      return { auth: { getUser: mockGetUser } } as never;
    });

    await proxy(req);

    const sbCookie = intlResponse.cookies.get("sb-token");
    expect(sbCookie?.value).toBe("refreshed-jwt");
  });
});
