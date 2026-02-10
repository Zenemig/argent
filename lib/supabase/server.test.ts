import { describe, it, expect, vi, beforeEach } from "vitest";

// ---------- mocks ----------

const mockGetAll = vi.fn().mockReturnValue([]);
const mockSet = vi.fn();
const mockGetUser = vi.fn();
const mockCreateServerClient = vi.fn();

vi.mock("next/headers", () => ({
  cookies: () =>
    Promise.resolve({
      getAll: mockGetAll,
      set: mockSet,
    }),
}));

vi.mock("@supabase/ssr", () => ({
  createServerClient: (...args: unknown[]) => {
    mockCreateServerClient(...args);
    return {
      auth: { getUser: mockGetUser },
    };
  },
}));

process.env.NEXT_PUBLIC_SUPABASE_URL = "http://localhost:54321";
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "test-anon-key";

const { createClient, getUser } = await import("./server");

// ---------- tests ----------

describe("createClient", () => {
  beforeEach(() => vi.clearAllMocks());

  it("passes env vars and cookie config to createServerClient", async () => {
    await createClient();
    expect(mockCreateServerClient).toHaveBeenCalledWith(
      "http://localhost:54321",
      "test-anon-key",
      expect.objectContaining({
        cookies: expect.objectContaining({
          getAll: expect.any(Function),
          setAll: expect.any(Function),
        }),
      }),
    );
  });

  it("cookie getAll delegates to cookieStore", async () => {
    const cookies = [{ name: "sb-token", value: "abc" }];
    mockGetAll.mockReturnValue(cookies);

    await createClient();

    const cookiesConfig = mockCreateServerClient.mock.calls[0][2].cookies;
    expect(cookiesConfig.getAll()).toEqual(cookies);
  });

  it("cookie setAll delegates to cookieStore.set", async () => {
    await createClient();

    const cookiesConfig = mockCreateServerClient.mock.calls[0][2].cookies;
    cookiesConfig.setAll([
      { name: "test", value: "val", options: { path: "/" } },
    ]);
    expect(mockSet).toHaveBeenCalledWith("test", "val", { path: "/" });
  });

  it("cookie setAll swallows errors in read-only Server Components", async () => {
    mockSet.mockImplementation(() => {
      throw new Error("Cookies are read-only");
    });

    await createClient();

    const cookiesConfig = mockCreateServerClient.mock.calls[0][2].cookies;
    expect(() =>
      cookiesConfig.setAll([{ name: "t", value: "v", options: {} }]),
    ).not.toThrow();
  });
});

describe("getUser", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns user when authenticated", async () => {
    const mockUser = { id: "user-123", email: "test@test.com" };
    mockGetUser.mockResolvedValue({ data: { user: mockUser } });

    const user = await getUser();
    expect(user).toEqual(mockUser);
  });

  it("returns null when not authenticated", async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } });

    const user = await getUser();
    expect(user).toBeNull();
  });
});
