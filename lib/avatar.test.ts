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
  uploadAvatar,
  downloadAvatar,
} from "./avatar";

describe("avatar helpers", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getLocalAvatar", () => {
    it("returns blob when stored", async () => {
      const blob = new Blob(["img"], { type: "image/jpeg" });
      mockGet.mockResolvedValue({ key: "avatarBlob", value: blob });

      const result = await getLocalAvatar();
      expect(result).toBe(blob);
      expect(mockGet).toHaveBeenCalledWith("avatarBlob");
    });

    it("returns null when no avatar stored", async () => {
      mockGet.mockResolvedValue(undefined);

      const result = await getLocalAvatar();
      expect(result).toBeNull();
    });
  });

  describe("setLocalAvatar", () => {
    it("stores blob in _syncMeta", async () => {
      const blob = new Blob(["img"], { type: "image/jpeg" });
      await setLocalAvatar(blob);
      expect(mockPut).toHaveBeenCalledWith({
        key: "avatarBlob",
        value: blob,
      });
    });
  });

  describe("removeLocalAvatar", () => {
    it("deletes from _syncMeta", async () => {
      await removeLocalAvatar();
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
