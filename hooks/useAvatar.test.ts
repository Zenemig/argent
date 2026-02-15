import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";

let mockAvatarBlob: Blob | null = null;
const mockMigrateGlobalAvatar = vi.fn().mockResolvedValue(undefined);

vi.mock("@/lib/avatar", () => ({
  getLocalAvatar: () => Promise.resolve(mockAvatarBlob),
  migrateGlobalAvatar: (...args: unknown[]) => mockMigrateGlobalAvatar(...args),
}));

const revokeObjectURL = vi.fn();
const createObjectURL = vi.fn().mockReturnValue("blob:mock-url");
vi.stubGlobal("URL", {
  ...URL,
  createObjectURL,
  revokeObjectURL,
});

import { useAvatar } from "./useAvatar";

describe("useAvatar", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAvatarBlob = null;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("returns null when userId is null", async () => {
    const { result } = renderHook(() => useAvatar(null));
    await waitFor(() => {
      expect(result.current).toBeNull();
    });
    expect(mockMigrateGlobalAvatar).not.toHaveBeenCalled();
  });

  it("returns null when no local avatar exists", async () => {
    const { result } = renderHook(() => useAvatar("user-123"));
    await waitFor(() => {
      expect(result.current).toBeNull();
    });
    expect(mockMigrateGlobalAvatar).toHaveBeenCalledWith("user-123");
  });

  it("returns object URL when avatar blob exists", async () => {
    mockAvatarBlob = new Blob(["img"], { type: "image/jpeg" });

    const { result } = renderHook(() => useAvatar("user-123"));
    await waitFor(() => {
      expect(result.current).toBe("blob:mock-url");
    });
    expect(createObjectURL).toHaveBeenCalledWith(mockAvatarBlob);
    expect(mockMigrateGlobalAvatar).toHaveBeenCalledWith("user-123");
  });

  it("revokes object URL on unmount", async () => {
    mockAvatarBlob = new Blob(["img"], { type: "image/jpeg" });

    const { result, unmount } = renderHook(() => useAvatar("user-123"));
    await waitFor(() => {
      expect(result.current).toBe("blob:mock-url");
    });

    unmount();
    expect(revokeObjectURL).toHaveBeenCalledWith("blob:mock-url");
  });
});
