import { describe, it, expect, vi, beforeEach } from "vitest";

const mockGetUser = vi.fn();
const mockSignOut = vi.fn();

vi.mock("@/lib/supabase/server", () => ({
  createClient: () =>
    Promise.resolve({
      auth: {
        getUser: mockGetUser,
        signOut: mockSignOut,
      },
    }),
}));

const mockAdminDeleteUser = vi.fn();
const mockStorageList = vi.fn();
const mockStorageRemove = vi.fn();
const mockAdminFrom = vi.fn();

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => ({
    auth: { admin: { deleteUser: mockAdminDeleteUser } },
    storage: {
      from: (bucket: string) => {
        mockAdminFrom(bucket);
        return {
          list: mockStorageList,
          remove: mockStorageRemove,
        };
      },
    },
  }),
}));

let mockLocaleCookie: string | undefined = undefined;

vi.mock("next/headers", () => ({
  cookies: () =>
    Promise.resolve({
      get: (name: string) =>
        name === "NEXT_LOCALE" && mockLocaleCookie
          ? { value: mockLocaleCookie }
          : undefined,
    }),
}));

const mockSendEmail = vi.fn();

vi.mock("@/lib/email/send-account-deleted", () => ({
  sendAccountDeletedEmail: (...args: unknown[]) => mockSendEmail(...args),
}));

import { POST } from "./route";

function makeRequest(body: Record<string, unknown>) {
  return new Request("http://localhost/api/account/delete", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("POST /api/account/delete", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockLocaleCookie = undefined;
    mockGetUser.mockResolvedValue({
      data: { user: { id: "user-123", email: "test@example.com" } },
    });
    mockAdminDeleteUser.mockResolvedValue({ error: null });
    mockStorageList.mockResolvedValue({ data: [], error: null });
    mockStorageRemove.mockResolvedValue({ error: null });
    mockSendEmail.mockResolvedValue(undefined);
    mockSignOut.mockResolvedValue({ error: null });
  });

  it("returns 401 when user is not authenticated", async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } });

    const res = await POST(makeRequest({ confirmation: "test@example.com" }));
    const json = await res.json();

    expect(res.status).toBe(401);
    expect(json.error).toBe("unauthenticated");
  });

  it("returns 400 when confirmation does not match email", async () => {
    const res = await POST(makeRequest({ confirmation: "wrong@example.com" }));
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json.error).toBe("confirmationMismatch");
  });

  it("sends deletion email with default English locale", async () => {
    await POST(makeRequest({ confirmation: "test@example.com" }));

    expect(mockSendEmail).toHaveBeenCalledWith({
      email: "test@example.com",
      locale: "en",
    });
  });

  it("sends deletion email with Spanish locale from cookie", async () => {
    mockLocaleCookie = "es";
    await POST(makeRequest({ confirmation: "test@example.com" }));

    expect(mockSendEmail).toHaveBeenCalledWith({
      email: "test@example.com",
      locale: "es",
    });
  });

  it("deletes storage files for the user", async () => {
    mockStorageList.mockResolvedValue({
      data: [{ name: "avatar.jpg" }, { name: "photo1.jpg" }],
      error: null,
    });

    await POST(makeRequest({ confirmation: "test@example.com" }));

    expect(mockAdminFrom).toHaveBeenCalledWith("reference-images");
    expect(mockStorageList).toHaveBeenCalledWith("user-123");
    expect(mockStorageRemove).toHaveBeenCalledWith([
      "user-123/avatar.jpg",
      "user-123/photo1.jpg",
    ]);
  });

  it("skips storage removal when no files exist", async () => {
    mockStorageList.mockResolvedValue({ data: [], error: null });

    await POST(makeRequest({ confirmation: "test@example.com" }));

    expect(mockStorageRemove).not.toHaveBeenCalled();
  });

  it("deletes the auth user via admin client", async () => {
    await POST(makeRequest({ confirmation: "test@example.com" }));

    expect(mockAdminDeleteUser).toHaveBeenCalledWith("user-123");
  });

  it("returns success on successful deletion", async () => {
    const res = await POST(makeRequest({ confirmation: "test@example.com" }));
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.success).toBe(true);
  });

  it("returns 500 when user deletion fails", async () => {
    mockAdminDeleteUser.mockResolvedValue({
      error: { message: "deletion failed" },
    });

    const res = await POST(makeRequest({ confirmation: "test@example.com" }));
    const json = await res.json();

    expect(res.status).toBe(500);
    expect(json.error).toBe("deletionFailed");
  });

  it("continues deletion even if email sending fails", async () => {
    mockSendEmail.mockRejectedValue(new Error("email failed"));

    const res = await POST(makeRequest({ confirmation: "test@example.com" }));
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.success).toBe(true);
    expect(mockAdminDeleteUser).toHaveBeenCalledWith("user-123");
  });

  it("continues deletion even if storage cleanup fails", async () => {
    mockStorageList.mockResolvedValue({
      data: null,
      error: { message: "list failed" },
    });

    const res = await POST(makeRequest({ confirmation: "test@example.com" }));
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.success).toBe(true);
    expect(mockAdminDeleteUser).toHaveBeenCalledWith("user-123");
  });
});
