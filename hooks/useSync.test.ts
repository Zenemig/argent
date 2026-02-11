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
  },
}));

import { useSync } from "./useSync";

describe("useSync", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockQueueStats = { pending: 0, failed: 0 };
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

  it("returns syncing when there are pending items", () => {
    mockQueueStats = { pending: 5, failed: 0 };
    const { result } = renderHook(() => useSync("user-123"));
    expect(result.current.syncState).toBe("syncing");
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
});
