import { describe, it, expect, vi, beforeEach } from "vitest";

// --- Mock fns at module scope ---

const mockListUsers = vi.fn();
const mockStorageList = vi.fn();
const mockStorageRemove = vi.fn();
const mockStorageFrom = vi.fn();
const mockFrom = vi.fn();

vi.mock("@next/env", () => ({
  loadEnvConfig: vi.fn(),
}));

vi.mock("@supabase/supabase-js", () => ({
  createClient: () => ({
    auth: { admin: { listUsers: mockListUsers } },
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

import { cleanupE2eData } from "./cleanup";

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
    mockStorageList.mockResolvedValue({ data: [], error: null });
    mockStorageRemove.mockResolvedValue({ error: null });
    mockFrom.mockReturnValue(Promise.resolve({ error: null }));
  });

  it("skips gracefully when E2E_USER_EMAIL is missing", async () => {
    vi.stubEnv("E2E_USER_EMAIL", "");
    const consoleSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

    await expect(cleanupE2eData()).resolves.toBeUndefined();

    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining("Missing env"),
    );
    expect(mockListUsers).not.toHaveBeenCalled();
    consoleSpy.mockRestore();
  });

  it("skips gracefully when SUPABASE_SERVICE_ROLE_KEY is missing", async () => {
    vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "");
    const consoleSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

    await expect(cleanupE2eData()).resolves.toBeUndefined();

    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining("Missing env"),
    );
    expect(mockListUsers).not.toHaveBeenCalled();
    consoleSpy.mockRestore();
  });

  it("resolves user UUID from email via listUsers", async () => {
    await cleanupE2eData();

    expect(mockListUsers).toHaveBeenCalled();
  });

  it("skips gracefully when user is not found", async () => {
    mockListUsers.mockResolvedValue({
      data: { users: [{ id: "other-user", email: "other@test.com" }] },
    });
    const consoleSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

    await expect(cleanupE2eData()).resolves.toBeUndefined();

    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining("not found"),
    );
    expect(mockFrom).not.toHaveBeenCalled();
    consoleSpy.mockRestore();
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
    consoleSpy.mockRestore();
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
    consoleSpy.mockRestore();
  });
});
