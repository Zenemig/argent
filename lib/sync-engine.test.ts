import { describe, it, expect, beforeEach, vi } from "vitest";
import "fake-indexeddb/auto";
import { ArgentDb } from "./db";
import type { SyncQueueItem } from "./types";

// We need to mock the db module so sync-engine uses our test db
let testDb: ArgentDb;

vi.mock("./db", async (importOriginal) => {
  const actual = await importOriginal<typeof import("./db")>();
  return {
    ...actual,
    get db() {
      return testDb;
    },
  };
});

// Import after mock setup
const {
  backoffDelay,
  convertTimestamps,
  stripLocalFields,
  deduplicateQueue,
  processUploadQueue,
  getQueueStats,
  retryFailedEntries,
  clearFailedEntries,
  getFailedEntrySummary,
  withTimeout,
} = await import("./sync-engine");

// ---------- Pure function tests ----------

describe("backoffDelay", () => {
  it("returns 1s for retry 0", () => {
    expect(backoffDelay(0)).toBe(1000);
  });

  it("doubles each retry", () => {
    expect(backoffDelay(1)).toBe(2000);
    expect(backoffDelay(2)).toBe(4000);
    expect(backoffDelay(3)).toBe(8000);
  });

  it("caps at 60s", () => {
    expect(backoffDelay(10)).toBe(60_000);
    expect(backoffDelay(20)).toBe(60_000);
  });
});

describe("convertTimestamps", () => {
  it("converts epoch-ms numbers to ISO strings", () => {
    const ts = 1700000000000;
    const result = convertTimestamps({
      id: "abc",
      created_at: ts,
      updated_at: ts,
      name: "test",
    });

    expect(result.created_at).toBe(new Date(ts).toISOString());
    expect(result.updated_at).toBe(new Date(ts).toISOString());
    expect(result.name).toBe("test");
    expect(result.id).toBe("abc");
  });

  it("leaves null timestamps as-is", () => {
    const result = convertTimestamps({
      deleted_at: null,
      finish_date: null,
    });
    expect(result.deleted_at).toBeNull();
    expect(result.finish_date).toBeNull();
  });

  it("leaves undefined timestamps as-is", () => {
    const result = convertTimestamps({ name: "test" });
    expect(result.deleted_at).toBeUndefined();
  });

  it("does not mutate the original object", () => {
    const original = { created_at: 1700000000000, name: "test" };
    convertTimestamps(original);
    expect(original.created_at).toBe(1700000000000);
  });
});

describe("stripLocalFields", () => {
  it("strips thumbnail from frames", () => {
    const entity = { id: "1", thumbnail: new Uint8Array(10), notes: "hi" };
    const result = stripLocalFields("frames", entity);
    expect(result.thumbnail).toBeUndefined();
    expect(result.notes).toBe("hi");
  });

  it("does not strip anything from cameras", () => {
    const entity = { id: "1", name: "Nikon FM2" };
    const result = stripLocalFields("cameras", entity);
    expect(result).toEqual(entity);
  });

  it("does not mutate the original object", () => {
    const original = { id: "1", thumbnail: "blob" };
    stripLocalFields("frames", original);
    expect(original.thumbnail).toBe("blob");
  });
});

describe("deduplicateQueue", () => {
  it("keeps the entry with the highest id per (table, entity_id)", () => {
    const items: SyncQueueItem[] = [
      {
        id: 1,
        table: "cameras",
        entity_id: "AAA",
        operation: "create",
        status: "pending",
        retry_count: 0,
        last_attempt: null,
      },
      {
        id: 5,
        table: "cameras",
        entity_id: "AAA",
        operation: "update",
        status: "pending",
        retry_count: 0,
        last_attempt: null,
      },
      {
        id: 3,
        table: "cameras",
        entity_id: "AAA",
        operation: "update",
        status: "pending",
        retry_count: 0,
        last_attempt: null,
      },
    ];

    const result = deduplicateQueue(items);
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe(5);
  });

  it("keeps distinct entities", () => {
    const items: SyncQueueItem[] = [
      {
        id: 1,
        table: "cameras",
        entity_id: "AAA",
        operation: "create",
        status: "pending",
        retry_count: 0,
        last_attempt: null,
      },
      {
        id: 2,
        table: "cameras",
        entity_id: "BBB",
        operation: "create",
        status: "pending",
        retry_count: 0,
        last_attempt: null,
      },
    ];

    const result = deduplicateQueue(items);
    expect(result).toHaveLength(2);
  });

  it("returns empty array for empty input", () => {
    expect(deduplicateQueue([])).toEqual([]);
  });
});

// ---------- Integration tests using Dexie (fake-indexeddb) ----------

describe("processUploadQueue", () => {
  beforeEach(async () => {
    // Create a fresh db instance for each test
    if (testDb) await testDb.delete();
    testDb = new ArgentDb();
    await testDb.open();
  });

  it("returns 0 when queue is empty", async () => {
    const mockSupabase = createMockSupabase();
    const synced = await processUploadQueue(mockSupabase as never);
    expect(synced).toBe(0);
  });

  it("syncs a pending camera and removes queue entry", async () => {
    await testDb.cameras.add({
      id: "01HTEST0000000000000000001",
      user_id: "supabase-uuid",
      name: "Nikon FM2",
      make: "Nikon",
      format: "35mm",
      default_frame_count: 36,
      notes: null,
      deleted_at: null,
      updated_at: Date.now(),
      created_at: Date.now(),
    });

    await testDb._syncQueue.add({
      table: "cameras",
      entity_id: "01HTEST0000000000000000001",
      operation: "create",
      status: "pending",
      retry_count: 0,
      last_attempt: null,
      payload: null,
    });

    const mockSupabase = createMockSupabase();
    const synced = await processUploadQueue(mockSupabase as never);

    expect(synced).toBe(1);
    expect(mockSupabase.from).toHaveBeenCalledWith("cameras");

    const remaining = await testDb._syncQueue.count();
    expect(remaining).toBe(0);

    const meta = await testDb._syncMeta.get("lastUploadSync");
    expect(meta).toBeDefined();
  });

  it("increments retry_count on failure", async () => {
    await testDb.cameras.add({
      id: "01HTEST0000000000000000002",
      user_id: "supabase-uuid",
      name: "Canon AE-1",
      make: "Canon",
      format: "35mm",
      default_frame_count: 36,
      notes: null,
      deleted_at: null,
      updated_at: Date.now(),
      created_at: Date.now(),
    });

    const queueId = await testDb._syncQueue.add({
      table: "cameras",
      entity_id: "01HTEST0000000000000000002",
      operation: "create",
      status: "pending",
      retry_count: 0,
      last_attempt: null,
      payload: null,
    });

    const mockSupabase = createMockSupabase({
      error: { message: "Network error", code: "500" },
    });

    const synced = await processUploadQueue(mockSupabase as never);
    expect(synced).toBe(0);

    const entry = await testDb._syncQueue.get(queueId);
    expect(entry!.retry_count).toBe(1);
    expect(entry!.last_attempt).toBeDefined();
    expect(entry!.status).toBe("in_progress");
  });

  it("marks as failed after 5 retries", async () => {
    await testDb.cameras.add({
      id: "01HTEST0000000000000000003",
      user_id: "supabase-uuid",
      name: "Leica M6",
      make: "Leica",
      format: "35mm",
      default_frame_count: 36,
      notes: null,
      deleted_at: null,
      updated_at: Date.now(),
      created_at: Date.now(),
    });

    const queueId = await testDb._syncQueue.add({
      table: "cameras",
      entity_id: "01HTEST0000000000000000003",
      operation: "create",
      status: "pending",
      retry_count: 4,
      last_attempt: null,
      payload: null,
    });

    const mockSupabase = createMockSupabase({
      error: { message: "Server error", code: "500" },
    });

    await processUploadQueue(mockSupabase as never);

    const entry = await testDb._syncQueue.get(queueId);
    expect(entry!.status).toBe("failed");
    expect(entry!.retry_count).toBe(5);
  });

  it("converts timestamps to ISO strings before upload", async () => {
    const ts = 1700000000000;
    await testDb.cameras.add({
      id: "01HTEST0000000000000000004",
      user_id: "supabase-uuid",
      name: "Test Cam",
      make: "Test",
      format: "35mm",
      default_frame_count: 36,
      notes: null,
      deleted_at: null,
      updated_at: ts,
      created_at: ts,
    });

    await testDb._syncQueue.add({
      table: "cameras",
      entity_id: "01HTEST0000000000000000004",
      operation: "create",
      status: "pending",
      retry_count: 0,
      last_attempt: null,
      payload: null,
    });

    let upsertedData: Record<string, unknown>[] = [];
    const mockSupabase = createMockSupabase(undefined, (data) => {
      upsertedData = data;
    });

    await processUploadQueue(mockSupabase as never);

    expect(upsertedData.length).toBe(1);
    expect(upsertedData[0].created_at).toBe(new Date(ts).toISOString());
    expect(upsertedData[0].updated_at).toBe(new Date(ts).toISOString());
  });

  it("resets stale in_progress entries when none are ready for retry", async () => {
    await testDb.cameras.add({
      id: "01HTEST0000000000000000009",
      user_id: "supabase-uuid",
      name: "Stale Cam",
      make: "Test",
      format: "35mm",
      default_frame_count: 36,
      notes: null,
      deleted_at: null,
      updated_at: Date.now(),
      created_at: Date.now(),
    });

    // Entry stuck in in_progress with recent last_attempt (backoff not expired)
    const queueId = await testDb._syncQueue.add({
      table: "cameras",
      entity_id: "01HTEST0000000000000000009",
      operation: "create",
      status: "in_progress",
      retry_count: 1,
      last_attempt: Date.now(), // just happened, backoff hasn't expired
      payload: null,
    });

    const mockSupabase = createMockSupabase();
    const synced = await processUploadQueue(mockSupabase as never);
    expect(synced).toBe(0);

    // Should be reset to pending so it gets picked up on next cycle
    const entry = await testDb._syncQueue.get(queueId);
    expect(entry!.status).toBe("pending");
    expect(entry!.retry_count).toBe(0);
  });

  it("removes queue entries when entity was deleted locally", async () => {
    const queueId = await testDb._syncQueue.add({
      table: "cameras",
      entity_id: "01HTEST_NONEXISTENT_ENTITY",
      operation: "create",
      status: "pending",
      retry_count: 0,
      last_attempt: null,
      payload: null,
    });

    const mockSupabase = createMockSupabase();
    await processUploadQueue(mockSupabase as never);

    const entry = await testDb._syncQueue.get(queueId);
    expect(entry).toBeUndefined();
  });
});

describe("getQueueStats", () => {
  beforeEach(async () => {
    if (testDb) await testDb.delete();
    testDb = new ArgentDb();
    await testDb.open();
  });

  it("returns zeros for empty queue", async () => {
    const stats = await getQueueStats();
    expect(stats).toEqual({ pending: 0, failed: 0 });
  });

  it("counts pending and failed separately", async () => {
    await testDb._syncQueue.bulkAdd([
      {
        table: "cameras",
        entity_id: "A",
        operation: "create",
        status: "pending",
        retry_count: 0,
        last_attempt: null,
        payload: null,
      },
      {
        table: "cameras",
        entity_id: "B",
        operation: "create",
        status: "pending",
        retry_count: 0,
        last_attempt: null,
        payload: null,
      },
      {
        table: "cameras",
        entity_id: "C",
        operation: "create",
        status: "failed",
        retry_count: 5,
        last_attempt: Date.now(),
        payload: null,
      },
    ]);

    const stats = await getQueueStats();
    expect(stats.pending).toBe(2);
    expect(stats.failed).toBe(1);
  });
});

// ---------- retryFailedEntries ----------

describe("retryFailedEntries", () => {
  beforeEach(async () => {
    if (testDb) await testDb.delete();
    testDb = new ArgentDb();
    await testDb.open();
  });

  it("resets failed entries to pending with retry_count 0", async () => {
    const id1 = await testDb._syncQueue.add({
      table: "cameras",
      entity_id: "A",
      operation: "create",
      status: "failed",
      retry_count: 5,
      last_attempt: Date.now(),
      payload: null,
    });
    const id2 = await testDb._syncQueue.add({
      table: "lenses",
      entity_id: "B",
      operation: "update",
      status: "failed",
      retry_count: 3,
      last_attempt: Date.now(),
      payload: null,
    });
    // This pending one should not be touched
    await testDb._syncQueue.add({
      table: "cameras",
      entity_id: "C",
      operation: "create",
      status: "pending",
      retry_count: 0,
      last_attempt: null,
      payload: null,
    });

    await retryFailedEntries();

    const entry1 = await testDb._syncQueue.get(id1);
    expect(entry1!.status).toBe("pending");
    expect(entry1!.retry_count).toBe(0);

    const entry2 = await testDb._syncQueue.get(id2);
    expect(entry2!.status).toBe("pending");
    expect(entry2!.retry_count).toBe(0);
  });

  it("does nothing when no failed entries exist", async () => {
    await testDb._syncQueue.add({
      table: "cameras",
      entity_id: "A",
      operation: "create",
      status: "pending",
      retry_count: 0,
      last_attempt: null,
      payload: null,
    });

    await retryFailedEntries();

    const count = await testDb._syncQueue.count();
    expect(count).toBe(1);
  });
});

// ---------- clearFailedEntries ----------

describe("clearFailedEntries", () => {
  beforeEach(async () => {
    if (testDb) await testDb.delete();
    testDb = new ArgentDb();
    await testDb.open();
  });

  it("deletes all failed entries", async () => {
    await testDb._syncQueue.bulkAdd([
      {
        table: "cameras",
        entity_id: "A",
        operation: "create",
        status: "failed",
        retry_count: 5,
        last_attempt: Date.now(),
        payload: null,
      },
      {
        table: "lenses",
        entity_id: "B",
        operation: "update",
        status: "failed",
        retry_count: 5,
        last_attempt: Date.now(),
        payload: null,
      },
      {
        table: "cameras",
        entity_id: "C",
        operation: "create",
        status: "pending",
        retry_count: 0,
        last_attempt: null,
        payload: null,
      },
    ]);

    await clearFailedEntries();

    const remaining = await testDb._syncQueue.toArray();
    expect(remaining).toHaveLength(1);
    expect(remaining[0].entity_id).toBe("C");
  });
});

// ---------- getFailedEntrySummary ----------

describe("getFailedEntrySummary", () => {
  beforeEach(async () => {
    if (testDb) await testDb.delete();
    testDb = new ArgentDb();
    await testDb.open();
  });

  it("groups failed entries by table", async () => {
    await testDb._syncQueue.bulkAdd([
      {
        table: "cameras",
        entity_id: "A",
        operation: "create",
        status: "failed",
        retry_count: 5,
        last_attempt: Date.now(),
        payload: null,
      },
      {
        table: "cameras",
        entity_id: "B",
        operation: "update",
        status: "failed",
        retry_count: 5,
        last_attempt: Date.now(),
        payload: null,
      },
      {
        table: "lenses",
        entity_id: "C",
        operation: "create",
        status: "failed",
        retry_count: 5,
        last_attempt: Date.now(),
        payload: null,
      },
      {
        table: "cameras",
        entity_id: "D",
        operation: "create",
        status: "pending",
        retry_count: 0,
        last_attempt: null,
        payload: null,
      },
    ]);

    const summary = await getFailedEntrySummary();

    expect(summary.get("cameras")).toEqual({
      count: 2,
      entities: [
        { id: "A", operation: "create" },
        { id: "B", operation: "update" },
      ],
    });
    expect(summary.get("lenses")).toEqual({
      count: 1,
      entities: [{ id: "C", operation: "create" }],
    });
    expect(summary.has("films")).toBe(false);
  });

  it("returns empty map when no failed entries", async () => {
    const summary = await getFailedEntrySummary();
    expect(summary.size).toBe(0);
  });
});

// ---------- withTimeout ----------

describe("withTimeout", () => {
  it("resolves when promise completes within timeout", async () => {
    const result = await withTimeout(
      Promise.resolve("ok"),
      1000,
    );
    expect(result).toBe("ok");
  });

  it("rejects when promise exceeds timeout", async () => {
    const slow = new Promise<string>((resolve) => {
      setTimeout(() => resolve("late"), 5000);
    });

    await expect(withTimeout(slow, 50)).rejects.toThrow(/timed out/i);
  });

  it("uses default timeout of 30s", async () => {
    // Just verify it doesn't throw for a fast promise with default timeout
    const result = await withTimeout(Promise.resolve(42));
    expect(result).toBe(42);
  });
});

// ---------- Helpers ----------

function createMockSupabase(
  upsertResult?: { error?: { message: string; code: string } },
  onUpsert?: (data: Record<string, unknown>[]) => void,
) {
  const upsertFn = vi.fn().mockImplementation((data, _options) => {
    if (onUpsert) onUpsert(data);
    return Promise.resolve(upsertResult ?? { error: null });
  });

  const fromFn = vi.fn().mockReturnValue({ upsert: upsertFn });

  return { from: fromFn };
}
