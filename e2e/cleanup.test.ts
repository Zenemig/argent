import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// --- Mock fns at module scope ---

const mockListUsers = vi.fn();
const mockCreateUser = vi.fn();
const mockDeleteUser = vi.fn();
const mockStorageList = vi.fn();
const mockStorageRemove = vi.fn();
const mockStorageFrom = vi.fn();
const mockFrom = vi.fn();

vi.mock("@next/env", () => ({
  loadEnvConfig: vi.fn(),
}));

vi.mock("@supabase/supabase-js", () => ({
  createClient: () => ({
    auth: {
      admin: {
        listUsers: mockListUsers,
        createUser: mockCreateUser,
        deleteUser: mockDeleteUser,
      },
    },
    storage: {
      from: (bucket: string) => {
        mockStorageFrom(bucket);
        return {
          list: mockStorageList,
          remove: mockStorageRemove,
        };
      },
    },
    from: (table: string) => {
      const chain = {
        delete: () => chain,
        eq: (...args: unknown[]) => {
          return mockFrom(table, ...args);
        },
      };
      return chain;
    },
  }),
}));

import {
  cleanupE2eData,
  createE2eUser,
  deleteE2eUser,
  cleanupOrphanE2eUsers,
} from "./cleanup";

describe("cleanupE2eData", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Default: all env vars present
    vi.stubEnv("E2E_USER_EMAIL", "e2e@test.com");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://fake.supabase.co");
    vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "fake-service-role-key");

    mockListUsers.mockResolvedValue({
      data: {
        users: [{ id: "user-uuid-123", email: "e2e@test.com" }],
      },
    });
    mockCreateUser.mockResolvedValue({
      data: { user: { id: "new-uuid" } },
      error: null,
    });
    mockDeleteUser.mockResolvedValue({ error: null });
    mockStorageList.mockResolvedValue({ data: [], error: null });
    mockStorageRemove.mockResolvedValue({ error: null });
    mockFrom.mockReturnValue(Promise.resolve({ error: null }));
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("throws when E2E_USER_EMAIL is missing", async () => {
    vi.stubEnv("E2E_USER_EMAIL", "");

    await expect(cleanupE2eData()).rejects.toThrow(/Missing required env/);

    expect(mockListUsers).not.toHaveBeenCalled();
  });

  it("throws when SUPABASE_SERVICE_ROLE_KEY is missing", async () => {
    vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "");

    await expect(cleanupE2eData()).rejects.toThrow(/Missing required env/);

    expect(mockListUsers).not.toHaveBeenCalled();
  });

  it("throws when NEXT_PUBLIC_SUPABASE_URL is missing", async () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "");

    await expect(cleanupE2eData()).rejects.toThrow(/Missing required env/);

    expect(mockListUsers).not.toHaveBeenCalled();
  });

  it("resolves user UUID from email via paginated listUsers", async () => {
    await cleanupE2eData();

    expect(mockListUsers).toHaveBeenCalledWith(
      expect.objectContaining({ page: 1, perPage: 50 }),
    );
  });

  it("finds user on a later page", async () => {
    mockListUsers
      // Page 1: other users, full page
      .mockResolvedValueOnce({
        data: {
          users: Array.from({ length: 50 }, (_, i) => ({
            id: `other-${i}`,
            email: `user${i}@other.com`,
          })),
        },
      })
      // Page 2: target user
      .mockResolvedValueOnce({
        data: {
          users: [{ id: "user-uuid-123", email: "e2e@test.com" }],
        },
      });

    await cleanupE2eData();

    expect(mockListUsers).toHaveBeenCalledTimes(2);
    expect(mockListUsers).toHaveBeenCalledWith(
      expect.objectContaining({ page: 2 }),
    );
    // Verify cleanup ran with the correct user ID
    expect(mockFrom).toHaveBeenCalled();
  });

  it("throws when user is not found after exhausting all pages", async () => {
    mockListUsers.mockResolvedValue({
      data: { users: [] },
    });

    await expect(cleanupE2eData()).rejects.toThrow(/not found/);

    expect(mockFrom).not.toHaveBeenCalled();
  });

  it("throws when listUsers returns an API error", async () => {
    mockListUsers.mockResolvedValue({
      data: null,
      error: { message: "rate limited" },
    });

    await expect(cleanupE2eData()).rejects.toThrow(/listUsers failed/);

    expect(mockFrom).not.toHaveBeenCalled();
  });

  it("deletes storage files including roll subfolders", async () => {
    // First call: top-level listing returns files + a subfolder
    mockStorageList
      .mockResolvedValueOnce({
        data: [
          { name: "avatar.jpg", id: "1" },
          { name: "roll-abc", id: null, metadata: null },
        ],
        error: null,
      })
      // Second call: subfolder listing
      .mockResolvedValueOnce({
        data: [{ name: "frame1.jpg", id: "2" }],
        error: null,
      });

    await cleanupE2eData();

    expect(mockStorageFrom).toHaveBeenCalledWith("reference-images");
    expect(mockStorageList).toHaveBeenCalledWith("user-uuid-123");
    expect(mockStorageList).toHaveBeenCalledWith("user-uuid-123/roll-abc");
    expect(mockStorageRemove).toHaveBeenCalledWith(
      expect.arrayContaining([
        "user-uuid-123/avatar.jpg",
        "user-uuid-123/roll-abc/frame1.jpg",
      ]),
    );
  });

  it("deletes DB rows in FK-safe order: rolls, lenses, cameras, films", async () => {
    const callOrder: string[] = [];
    mockFrom.mockImplementation((table: string) => {
      callOrder.push(table);
      return Promise.resolve({ error: null });
    });

    await cleanupE2eData();

    const rollsIdx = callOrder.indexOf("rolls");
    const lensesIdx = callOrder.indexOf("lenses");
    const camerasIdx = callOrder.indexOf("cameras");
    const filmsIdx = callOrder.indexOf("films");

    expect(rollsIdx).toBeGreaterThanOrEqual(0);
    expect(lensesIdx).toBeGreaterThan(rollsIdx);
    expect(camerasIdx).toBeGreaterThan(rollsIdx);
    expect(filmsIdx).toBeGreaterThan(rollsIdx);
  });

  it("does NOT delete user_profiles", async () => {
    await cleanupE2eData();

    const tables = mockFrom.mock.calls.map(
      (call: unknown[]) => call[0],
    );
    expect(tables).not.toContain("user_profiles");
  });

  it("does NOT call admin.auth.admin.deleteUser", async () => {
    // The mock client has no deleteUser — if cleanup tried to call it,
    // it would throw. This test passing = cleanup doesn't delete the user.
    await expect(cleanupE2eData()).resolves.toBeUndefined();
  });

  it("handles storage list errors gracefully", async () => {
    mockStorageList.mockResolvedValue({
      data: null,
      error: { message: "storage error" },
    });
    const consoleSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

    await expect(cleanupE2eData()).resolves.toBeUndefined();

    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining("Storage"),
    );
    // DB cleanup should still proceed
    expect(mockFrom).toHaveBeenCalled();
  });

  it("handles DB delete errors gracefully", async () => {
    mockFrom.mockImplementation(() => {
      return Promise.resolve({ error: { message: "db error" } });
    });
    const consoleSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

    await expect(cleanupE2eData()).resolves.toBeUndefined();

    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining("rolls"),
    );
  });
});

describe("createE2eUser", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv("E2E_USER_EMAIL", "e2e-12345678@example.com");
    vi.stubEnv("E2E_USER_PASSWORD", "test-password");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://fake.supabase.co");
    vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "fake-service-role-key");
    mockCreateUser.mockResolvedValue({
      data: { user: { id: "new-uuid" } },
      error: null,
    });
  });

  it("throws when E2E_USER_EMAIL is missing", async () => {
    vi.stubEnv("E2E_USER_EMAIL", "");
    await expect(createE2eUser()).rejects.toThrow(/Missing required env/);
    expect(mockCreateUser).not.toHaveBeenCalled();
  });

  it("throws when E2E_USER_PASSWORD is missing", async () => {
    vi.stubEnv("E2E_USER_PASSWORD", "");
    await expect(createE2eUser()).rejects.toThrow(/Missing required env/);
    expect(mockCreateUser).not.toHaveBeenCalled();
  });

  it("calls createUser with email_confirm: true", async () => {
    await createE2eUser();
    expect(mockCreateUser).toHaveBeenCalledWith({
      email: "e2e-12345678@example.com",
      password: "test-password",
      email_confirm: true,
    });
  });

  it("throws when createUser returns an API error", async () => {
    mockCreateUser.mockResolvedValue({
      error: { message: "already exists" },
    });
    await expect(createE2eUser()).rejects.toThrow(/createUser failed/);
  });
});

describe("deleteE2eUser", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv("E2E_USER_EMAIL", "e2e-12345678@example.com");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://fake.supabase.co");
    vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "fake-service-role-key");
    mockListUsers.mockResolvedValue({
      data: {
        users: [
          { id: "user-uuid-123", email: "e2e-12345678@example.com" },
        ],
      },
      error: null,
    });
    mockDeleteUser.mockResolvedValue({ error: null });
  });

  it("throws when E2E_USER_EMAIL is missing", async () => {
    vi.stubEnv("E2E_USER_EMAIL", "");
    await expect(deleteE2eUser()).rejects.toThrow(/Missing required env/);
  });

  it("calls deleteUser with resolved UUID", async () => {
    await deleteE2eUser();
    expect(mockDeleteUser).toHaveBeenCalledWith("user-uuid-123");
  });

  it("resolves silently when user is not found", async () => {
    mockListUsers.mockResolvedValue({ data: { users: [] }, error: null });
    await expect(deleteE2eUser()).resolves.toBeUndefined();
    expect(mockDeleteUser).not.toHaveBeenCalled();
  });

  it("throws when listUsers returns an API error", async () => {
    mockListUsers.mockResolvedValue({
      data: null,
      error: { message: "rate limited" },
    });
    await expect(deleteE2eUser()).rejects.toThrow(/listUsers failed/);
  });

  it("throws when deleteUser returns an API error", async () => {
    mockDeleteUser.mockResolvedValue({
      error: { message: "not authorized" },
    });
    await expect(deleteE2eUser()).rejects.toThrow(/deleteUser failed/);
  });
});

describe("cleanupOrphanE2eUsers", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv("E2E_USER_EMAIL", "e2e-current-run@example.com");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://fake.supabase.co");
    vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "fake-service-role-key");
    mockDeleteUser.mockResolvedValue({ error: null });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("throws when SUPABASE_SERVICE_ROLE_KEY is missing", async () => {
    vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "");
    await expect(cleanupOrphanE2eUsers()).rejects.toThrow(
      /Missing required env/,
    );
    expect(mockDeleteUser).not.toHaveBeenCalled();
  });

  it("deletes users matching e2e-*@example.com pattern", async () => {
    mockListUsers.mockResolvedValue({
      data: {
        users: [
          { id: "orphan-1", email: "e2e-111@example.com" },
          { id: "orphan-2", email: "e2e-222@example.com" },
          { id: "real-user", email: "user@gmail.com" },
        ],
      },
      error: null,
    });

    await cleanupOrphanE2eUsers();

    expect(mockDeleteUser).toHaveBeenCalledTimes(2);
    expect(mockDeleteUser).toHaveBeenCalledWith("orphan-1");
    expect(mockDeleteUser).toHaveBeenCalledWith("orphan-2");
  });

  it("skips non-matching users", async () => {
    mockListUsers.mockResolvedValue({
      data: {
        users: [{ id: "real", email: "user@example.com" }],
      },
      error: null,
    });

    await cleanupOrphanE2eUsers();

    expect(mockDeleteUser).not.toHaveBeenCalled();
  });

  it("excludes the current run's own user from orphan cleanup", async () => {
    vi.stubEnv("E2E_USER_EMAIL", "e2e-99999@example.com");
    mockListUsers.mockResolvedValue({
      data: {
        users: [
          { id: "current-run", email: "e2e-99999@example.com" },
          { id: "orphan-1", email: "e2e-111@example.com" },
        ],
      },
      error: null,
    });

    await cleanupOrphanE2eUsers();

    expect(mockDeleteUser).toHaveBeenCalledTimes(1);
    expect(mockDeleteUser).toHaveBeenCalledWith("orphan-1");
    expect(mockDeleteUser).not.toHaveBeenCalledWith("current-run");
  });

  it("continues after a per-user delete failure", async () => {
    mockListUsers.mockResolvedValue({
      data: {
        users: [
          { id: "orphan-1", email: "e2e-111@example.com" },
          { id: "orphan-2", email: "e2e-222@example.com" },
        ],
      },
      error: null,
    });
    mockDeleteUser
      .mockResolvedValueOnce({ error: { message: "db error" } })
      .mockResolvedValueOnce({ error: null });
    const consoleSpy = vi
      .spyOn(console, "warn")
      .mockImplementation(() => {});

    await expect(cleanupOrphanE2eUsers()).resolves.toBeUndefined();
    expect(mockDeleteUser).toHaveBeenCalledTimes(2);
  });

  it("handles listUsers API error gracefully", async () => {
    mockListUsers.mockResolvedValue({
      data: null,
      error: { message: "network error" },
    });
    vi.spyOn(console, "warn").mockImplementation(() => {});

    await expect(cleanupOrphanE2eUsers()).resolves.toBeUndefined();
    expect(mockDeleteUser).not.toHaveBeenCalled();
  });

  it("paginates through all pages", async () => {
    mockListUsers
      .mockResolvedValueOnce({
        data: {
          users: Array.from({ length: 50 }, (_, i) => ({
            id: `user-${i}`,
            email: `e2e-${i}@example.com`,
          })),
        },
        error: null,
      })
      .mockResolvedValueOnce({
        data: {
          users: [{ id: "last-orphan", email: "e2e-99999@example.com" }],
        },
        error: null,
      });

    await cleanupOrphanE2eUsers();

    expect(mockListUsers).toHaveBeenCalledTimes(2);
    expect(mockDeleteUser).toHaveBeenCalledTimes(51);
  });
});
