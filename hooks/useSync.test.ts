import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";

const mockProcessDownloadSync = vi.fn().mockResolvedValue(undefined);
const mockProcessUploadQueue = vi.fn().mockResolvedValue(undefined);

vi.mock("@/lib/sync-engine", () => ({
  processDownloadSync: (...args: unknown[]) =>
    mockProcessDownloadSync(...args),
  processUploadQueue: (...args: unknown[]) => mockProcessUploadQueue(...args),
}));

vi.mock("@/lib/supabase/client", () => ({
  createClient: () => ({}),
}));

let mockQueueStats: { pending: number; failed: number } | undefined = {
  pending: 0,
  failed: 0,
};

let mockLastUploadSync: string | null = null;

vi.mock("dexie-react-hooks", () => ({
  useLiveQuery: () => mockQueueStats,
}));

vi.mock("@/lib/db", () => ({
  db: {
    _syncQueue: {
      where: () => ({
        anyOf: () => ({ count: () => Promise.resolve(0) }),
        equals: () => ({ count: () => Promise.resolve(0) }),
      }),
    },
    _syncMeta: {
      get: (key: string) => {
        if (key === "lastUploadSync" && mockLastUploadSync) {
          return Promise.resolve({ key, value: mockLastUploadSync });
        }
        return Promise.resolve(undefined);
      },
    },
  },
}));

import { useSync } from "./useSync";

describe("useSync", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockQueueStats = { pending: 0, failed: 0 };
    mockLastUploadSync = null;
    Object.defineProperty(navigator, "onLine", {
      value: true,
      writable: true,
      configurable: true,
    });
  });

  it("returns local-only when userId is null", () => {
    const { result } = renderHook(() => useSync(null));
    expect(result.current.syncState).toBe("local-only");
  });

  it("returns local-only when enabled is false", () => {
    const { result } = renderHook(() =>
      useSync("user-123", { enabled: false }),
    );
    expect(result.current.syncState).toBe("local-only");
  });

  it("returns synced when online with no pending/failed items", async () => {
    mockQueueStats = { pending: 0, failed: 0 };
    const { result } = renderHook(() => useSync("user-123"));
    await waitFor(() => {
      expect(result.current.syncState).toBe("synced");
    });
  });

  it("returns error when there are failed items", async () => {
    mockQueueStats = { pending: 0, failed: 3 };
    const { result } = renderHook(() => useSync("user-123"));
    await waitFor(() => {
      expect(result.current.syncState).toBe("error");
    });
    expect(result.current.failedCount).toBe(3);
  });

  it("returns synced when there are pending items but sync is not running", async () => {
    mockQueueStats = { pending: 5, failed: 0 };
    const { result } = renderHook(() => useSync("user-123"));
    // After initial sync completes, pending items waiting for next cycle
    // should not show perpetual "syncing"
    await waitFor(() => {
      expect(result.current.syncState).toBe("synced");
    });
  });

  it("exposes syncNow function", () => {
    const { result } = renderHook(() => useSync("user-123"));
    expect(typeof result.current.syncNow).toBe("function");
  });

  it("syncNow does not run when userId is null", async () => {
    const { result } = renderHook(() => useSync(null));
    await act(async () => {
      await result.current.syncNow();
    });
    expect(mockProcessDownloadSync).not.toHaveBeenCalled();
    expect(mockProcessUploadQueue).not.toHaveBeenCalled();
  });

  it("exposes pendingCount from queue stats", () => {
    mockQueueStats = { pending: 7, failed: 0 };
    const { result } = renderHook(() => useSync("user-123"));
    expect(result.current.pendingCount).toBe(7);
  });

  it("pagehide resets syncInProgressRef so future syncs are not blocked", async () => {
    const { result } = renderHook(() => useSync("user-123"));

    // Start a sync to set syncInProgressRef
    await act(async () => {
      await result.current.syncNow();
    });

    // Simulate pagehide (iOS suspending JS)
    act(() => {
      window.dispatchEvent(new Event("pagehide"));
    });

    // Next sync should be allowed (not blocked by stale ref)
    mockProcessDownloadSync.mockClear();
    mockProcessUploadQueue.mockClear();

    await act(async () => {
      await result.current.syncNow();
    });

    expect(mockProcessDownloadSync).toHaveBeenCalled();
  });

  it("visibilitychange refreshes isOnline from navigator.onLine", async () => {
    Object.defineProperty(navigator, "onLine", {
      value: false,
      configurable: true,
    });

    const { result } = renderHook(() => useSync("user-123"));

    // Should be offline now
    await waitFor(() => {
      expect(result.current.syncState).toBe("offline");
    });

    // Simulate coming back online + visibility change (iOS resume)
    Object.defineProperty(navigator, "onLine", {
      value: true,
      configurable: true,
    });

    await act(async () => {
      document.dispatchEvent(new Event("visibilitychange"));
    });

    // Should have attempted sync
    expect(mockProcessDownloadSync).toHaveBeenCalled();
  });

  it("captures lastError on download failure and clears on success", async () => {
    mockProcessDownloadSync.mockRejectedValueOnce(
      new Error("Network failure"),
    );

    const { result } = renderHook(() => useSync("user-123"));

    await waitFor(() => {
      expect(result.current.lastError).toBe("Network failure");
    });

    // Next successful sync should clear the error
    mockProcessDownloadSync.mockResolvedValueOnce(undefined);
    mockProcessUploadQueue.mockResolvedValueOnce(undefined);

    await act(async () => {
      await result.current.syncNow();
    });

    await waitFor(() => {
      expect(result.current.lastError).toBeNull();
    });
  });
});
