import { describe, it, expect, vi, beforeEach } from "vitest";

const mockGet = vi.fn();
const mockPut = vi.fn();
const mockDelete = vi.fn();

vi.mock("@/lib/db", () => ({
  db: {
    _syncMeta: {
      get: (...args: unknown[]) => mockGet(...args),
      put: (...args: unknown[]) => mockPut(...args),
      delete: (...args: unknown[]) => mockDelete(...args),
    },
  },
}));

vi.mock("@/lib/image-sync", () => ({
  compressImage: vi.fn().mockResolvedValue(new Blob(["compressed"], { type: "image/jpeg" })),
}));

import {
  getLocalAvatar,
  setLocalAvatar,
  removeLocalAvatar,
  migrateGlobalAvatar,
  clearGlobalAvatarKey,
  uploadAvatar,
  downloadAvatar,
} from "./avatar";

describe("avatar helpers", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getLocalAvatar", () => {
    it("returns blob when stored under user-scoped key", async () => {
      const blob = new Blob(["img"], { type: "image/jpeg" });
      mockGet.mockResolvedValue({ key: "avatarBlob:user-123", value: blob });

      const result = await getLocalAvatar("user-123");
      expect(result).toBe(blob);
      expect(mockGet).toHaveBeenCalledWith("avatarBlob:user-123");
    });

    it("returns null when no avatar stored", async () => {
      mockGet.mockResolvedValue(undefined);

      const result = await getLocalAvatar("user-123");
      expect(result).toBeNull();
    });
  });

  describe("setLocalAvatar", () => {
    it("stores blob under user-scoped key", async () => {
      const blob = new Blob(["img"], { type: "image/jpeg" });
      await setLocalAvatar("user-123", blob);
      expect(mockPut).toHaveBeenCalledWith({
        key: "avatarBlob:user-123",
        value: blob,
      });
    });
  });

  describe("removeLocalAvatar", () => {
    it("deletes user-scoped key from _syncMeta", async () => {
      await removeLocalAvatar("user-123");
      expect(mockDelete).toHaveBeenCalledWith("avatarBlob:user-123");
    });
  });

  describe("migrateGlobalAvatar", () => {
    it("migrates global key to user-scoped key", async () => {
      const blob = new Blob(["img"], { type: "image/jpeg" });
      mockGet.mockImplementation((key: string) => {
        if (key === "avatarBlob") return Promise.resolve({ key: "avatarBlob", value: blob });
        return Promise.resolve(undefined);
      });

      await migrateGlobalAvatar("user-123");

      expect(mockPut).toHaveBeenCalledWith({
        key: "avatarBlob:user-123",
        value: blob,
      });
      expect(mockDelete).toHaveBeenCalledWith("avatarBlob");
    });

    it("skips copy when user already has a scoped avatar", async () => {
      const blob = new Blob(["img"], { type: "image/jpeg" });
      mockGet.mockImplementation((key: string) => {
        if (key === "avatarBlob") return Promise.resolve({ key: "avatarBlob", value: blob });
        if (key === "avatarBlob:user-123") return Promise.resolve({ key: "avatarBlob:user-123", value: blob });
        return Promise.resolve(undefined);
      });

      await migrateGlobalAvatar("user-123");

      expect(mockPut).not.toHaveBeenCalled();
      expect(mockDelete).toHaveBeenCalledWith("avatarBlob");
    });

    it("does nothing when no global key exists", async () => {
      mockGet.mockResolvedValue(undefined);

      await migrateGlobalAvatar("user-123");

      expect(mockPut).not.toHaveBeenCalled();
      expect(mockDelete).not.toHaveBeenCalled();
    });

    it("always deletes the global key even when scoped exists", async () => {
      const blob = new Blob(["img"], { type: "image/jpeg" });
      mockGet.mockImplementation((key: string) => {
        if (key === "avatarBlob") return Promise.resolve({ key: "avatarBlob", value: blob });
        if (key === "avatarBlob:user-456") return Promise.resolve({ key: "avatarBlob:user-456", value: blob });
        return Promise.resolve(undefined);
      });

      await migrateGlobalAvatar("user-456");

      expect(mockDelete).toHaveBeenCalledWith("avatarBlob");
    });
  });

  describe("clearGlobalAvatarKey", () => {
    it("deletes the global avatarBlob key", async () => {
      await clearGlobalAvatarKey();
      expect(mockDelete).toHaveBeenCalledWith("avatarBlob");
    });
  });

  describe("uploadAvatar", () => {
    it("compresses, uploads, and updates profile", async () => {
      const blob = new Blob(["img"], { type: "image/jpeg" });
      const mockUpload = vi.fn().mockResolvedValue({ error: null });
      const mockUpdate = vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ error: null }),
      });
      const supabase = {
        storage: {
          from: () => ({ upload: mockUpload }),
        },
        from: () => ({ update: mockUpdate }),
      };

      const result = await uploadAvatar(
        supabase as never,
        "user-123",
        blob,
      );

      expect(result).toBe("user-123/avatar.jpg");
      expect(mockUpload).toHaveBeenCalledWith(
        "user-123/avatar.jpg",
        expect.any(Blob),
        { contentType: "image/jpeg", upsert: true },
      );
    });

    it("returns null on upload error", async () => {
      const blob = new Blob(["img"], { type: "image/jpeg" });
      const supabase = {
        storage: {
          from: () => ({
            upload: vi.fn().mockResolvedValue({ error: { message: "fail" } }),
          }),
        },
      };

      const result = await uploadAvatar(supabase as never, "user-123", blob);
      expect(result).toBeNull();
    });
  });

  describe("downloadAvatar", () => {
    it("downloads blob from storage", async () => {
      const blob = new Blob(["img"], { type: "image/jpeg" });
      const supabase = {
        storage: {
          from: () => ({
            download: vi.fn().mockResolvedValue({ data: blob, error: null }),
          }),
        },
      };

      const result = await downloadAvatar(supabase as never, "user-123/avatar.jpg");
      expect(result).toBe(blob);
    });

    it("returns null on download error", async () => {
      const supabase = {
        storage: {
          from: () => ({
            download: vi.fn().mockResolvedValue({ data: null, error: { message: "fail" } }),
          }),
        },
      };

      const result = await downloadAvatar(supabase as never, "user-123/avatar.jpg");
      expect(result).toBeNull();
    });
  });
});
