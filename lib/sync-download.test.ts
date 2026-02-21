import { describe, it, expect, beforeEach, vi } from "vitest";
import "fake-indexeddb/auto";
import { ArgentDb } from "./db";

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
  convertTimestampsFromServer,
  preserveLocalFields,
  downloadFromTable,
  processDownloadSync,
} = await import("./sync-engine");

// ---------- Pure function tests ----------

describe("convertTimestampsFromServer", () => {
  it("converts ISO strings to epoch-ms numbers", () => {
    const iso = "2023-11-14T22:13:20.000Z";
    const result = convertTimestampsFromServer({
      id: "abc",
      created_at: iso,
      updated_at: iso,
      name: "test",
    });

    expect(result.created_at).toBe(new Date(iso).getTime());
    expect(result.updated_at).toBe(new Date(iso).getTime());
    expect(result.name).toBe("test");
    expect(result.id).toBe("abc");
  });

  it("leaves null timestamps as-is", () => {
    const result = convertTimestampsFromServer({
      deleted_at: null,
      finish_date: null,
    });
    expect(result.deleted_at).toBeNull();
    expect(result.finish_date).toBeNull();
  });

  it("leaves undefined timestamps as-is", () => {
    const result = convertTimestampsFromServer({ name: "test" });
    expect(result.deleted_at).toBeUndefined();
  });

  it("does not mutate the original object", () => {
    const iso = "2023-11-14T22:13:20.000Z";
    const original = { created_at: iso, name: "test" };
    convertTimestampsFromServer(original);
    expect(original.created_at).toBe(iso);
  });

  it("handles all timestamp fields", () => {
    const iso = "2024-01-15T10:30:00.000Z";
    const expected = new Date(iso).getTime();
    const result = convertTimestampsFromServer({
      created_at: iso,
      updated_at: iso,
      deleted_at: iso,
      start_date: iso,
      finish_date: iso,
      develop_date: iso,
      scan_date: iso,
      captured_at: iso,
    });

    expect(result.created_at).toBe(expected);
    expect(result.updated_at).toBe(expected);
    expect(result.deleted_at).toBe(expected);
    expect(result.start_date).toBe(expected);
    expect(result.finish_date).toBe(expected);
    expect(result.develop_date).toBe(expected);
    expect(result.scan_date).toBe(expected);
    expect(result.captured_at).toBe(expected);
  });
});

describe("preserveLocalFields", () => {
  it("preserves thumbnail for frames when local entity has one", () => {
    const thumbnailBlob = new Uint8Array([1, 2, 3]);
    const serverEntity = { id: "frame1", frame_number: 1, notes: "hi" };
    const localEntity = {
      id: "frame1",
      frame_number: 1,
      thumbnail: thumbnailBlob,
    };

    const result = preserveLocalFields(
      "frames",
      serverEntity,
      localEntity,
    );

    expect(result.thumbnail).toBe(thumbnailBlob);
    expect(result.notes).toBe("hi");
  });

  it("does not add thumbnail for frames when local has none", () => {
    const serverEntity = { id: "frame1", frame_number: 1 };
    const localEntity = { id: "frame1", frame_number: 1 };

    const result = preserveLocalFields(
      "frames",
      serverEntity,
      localEntity,
    );

    expect(result.thumbnail).toBeUndefined();
  });

  it("does not add thumbnail for frames when no local entity", () => {
    const serverEntity = { id: "frame1", frame_number: 1 };

    const result = preserveLocalFields("frames", serverEntity, undefined);

    expect(result.thumbnail).toBeUndefined();
  });

  it("returns server entity as-is for non-frame tables", () => {
    const serverEntity = { id: "cam1", name: "Nikon FM2" };
    const localEntity = { id: "cam1", name: "Old Name" };

    const result = preserveLocalFields(
      "cameras",
      serverEntity,
      localEntity,
    );

    expect(result).toBe(serverEntity);
  });

  it("returns server entity as-is for lenses", () => {
    const serverEntity = { id: "lens1", name: "50mm f/1.4" };
    const result = preserveLocalFields("lenses", serverEntity, undefined);
    expect(result).toBe(serverEntity);
  });
});

// ---------- Integration tests using Dexie (fake-indexeddb) ----------

describe("downloadFromTable", () => {
  beforeEach(async () => {
    if (testDb) await testDb.delete();
    testDb = new ArgentDb();
    await testDb.open();
  });

  it("downloads all rows when since is null (full resync)", async () => {
    const rows = [
      { id: "cam1", name: "Nikon FM2", updated_at: "2024-01-01T00:00:00Z" },
      { id: "cam2", name: "Canon AE-1", updated_at: "2024-01-02T00:00:00Z" },
    ];

    const mockSupabase = createMockDownloadSupabase(rows);
    const result = await downloadFromTable(mockSupabase as never, "cameras", null);

    expect(result).toHaveLength(2);
    expect(result[0].id).toBe("cam1");
    expect(result[1].id).toBe("cam2");
  });

  it("downloads only rows after since timestamp (incremental)", async () => {
    const rows = [
      { id: "cam2", name: "Canon AE-1", updated_at: "2024-01-02T00:00:00Z" },
    ];

    const mockSupabase = createMockDownloadSupabase(rows);
    const result = await downloadFromTable(
      mockSupabase as never,
      "cameras",
      "2024-01-01T00:00:00Z",
    );

    expect(result).toHaveLength(1);
    // Verify gt was called
    expect(mockSupabase._gtCalled).toBe(true);
    expect(mockSupabase._gtArgs).toEqual(["updated_at", "2024-01-01T00:00:00Z"]);
  });

  it("handles pagination across multiple pages", async () => {
    // First page: 1000 rows, second page: 500 rows
    const page1 = Array.from({ length: 1000 }, (_, i) => ({
      id: `cam${i}`,
      updated_at: "2024-01-01T00:00:00Z",
    }));
    const page2 = Array.from({ length: 500 }, (_, i) => ({
      id: `cam${1000 + i}`,
      updated_at: "2024-01-02T00:00:00Z",
    }));

    const mockSupabase = createMockPaginatedSupabase([page1, page2]);
    const result = await downloadFromTable(mockSupabase as never, "cameras", null);

    expect(result).toHaveLength(1500);
  });

  it("throws on Supabase error", async () => {
    const mockSupabase = createMockDownloadSupabase(
      null,
      { message: "Permission denied", code: "403" },
    );

    await expect(
      downloadFromTable(mockSupabase as never, "cameras", null),
    ).rejects.toThrow("Download from cameras failed: Permission denied");
  });

  it("returns empty array when no data", async () => {
    const mockSupabase = createMockDownloadSupabase([]);
    const result = await downloadFromTable(mockSupabase as never, "cameras", null);
    expect(result).toHaveLength(0);
  });
});

describe("processDownloadSync", () => {
  beforeEach(async () => {
    if (testDb) await testDb.delete();
    testDb = new ArgentDb();
    await testDb.open();
  });

  it("performs full resync when no lastDownloadSync exists", async () => {
    const serverCameras = [
      {
        id: "01HTEST0000000000000000001",
        user_id: "user-123",
        name: "Nikon FM2",
        make: "Nikon",
        format: "35mm",
        default_frame_count: 36,
        notes: null,
        deleted_at: null,
        updated_at: "2024-01-15T10:00:00.000Z",
        created_at: "2024-01-10T08:00:00.000Z",
      },
    ];

    const mockSupabase = createMockTableSupabase({
      cameras: serverCameras,
      lenses: [],
      films: [],
      rolls: [],
      frames: [],
    });

    const result = await processDownloadSync(mockSupabase as never);

    expect(result.downloaded).toBe(1);
    expect(result.conflicts).toBe(0);

    // Verify camera was written to Dexie with epoch-ms timestamps
    const cam = await testDb.cameras.get("01HTEST0000000000000000001");
    expect(cam).toBeDefined();
    expect(cam!.name).toBe("Nikon FM2");
    expect(cam!.updated_at).toBe(new Date("2024-01-15T10:00:00.000Z").getTime());
    expect(cam!.created_at).toBe(new Date("2024-01-10T08:00:00.000Z").getTime());
  });

  it("performs incremental sync using lastDownloadSync watermark", async () => {
    // Set a previous watermark
    await testDb._syncMeta.put({
      key: "lastDownloadSync",
      value: "2024-01-14T00:00:00.000Z",
    });

    const serverCameras = [
      {
        id: "01HTEST0000000000000000001",
        user_id: "user-123",
        name: "Updated Camera",
        make: "Nikon",
        format: "35mm",
        default_frame_count: 36,
        notes: null,
        deleted_at: null,
        updated_at: "2024-01-15T10:00:00.000Z",
        created_at: "2024-01-10T08:00:00.000Z",
      },
    ];

    const mockSupabase = createMockTableSupabase({
      cameras: serverCameras,
      lenses: [],
      films: [],
      rolls: [],
      frames: [],
    });

    const result = await processDownloadSync(mockSupabase as never);

    expect(result.downloaded).toBe(1);

    // Verify the gt filter was applied
    expect(mockSupabase._gtCalls.cameras).toBe(true);
  });

  it("updates lastDownloadSync watermark from server data", async () => {
    const serverCameras = [
      {
        id: "01HTEST0000000000000000001",
        user_id: "user-123",
        name: "Camera 1",
        make: "Nikon",
        format: "35mm",
        default_frame_count: 36,
        notes: null,
        deleted_at: null,
        updated_at: "2024-01-15T10:00:00.000Z",
        created_at: "2024-01-10T08:00:00.000Z",
      },
    ];

    const serverLenses = [
      {
        id: "01HTEST0000000000000000002",
        user_id: "user-123",
        camera_id: null,
        name: "50mm f/1.4",
        make: "Nikon",
        focal_length: 50,
        max_aperture: 1.4,
        deleted_at: null,
        updated_at: "2024-01-16T12:00:00.000Z",
        created_at: "2024-01-10T08:00:00.000Z",
      },
    ];

    const mockSupabase = createMockTableSupabase({
      cameras: serverCameras,
      lenses: serverLenses,
      films: [],
      rolls: [],
      frames: [],
    });

    await processDownloadSync(mockSupabase as never);

    const meta = await testDb._syncMeta.get("lastDownloadSync");
    expect(meta).toBeDefined();
    // Should use the max updated_at across all tables (lens is newer)
    expect(meta!.value).toBe("2024-01-16T12:00:00.000Z");
  });

  it("detects conflicts and logs to _syncConflicts", async () => {
    // Local camera with pending queue entry
    const localCamera = {
      id: "01HTEST0000000000000000001",
      user_id: "user-123",
      name: "Local Name",
      make: "Nikon",
      format: "35mm" as const,
      default_frame_count: 36,
      notes: null,
      deleted_at: null,
      updated_at: Date.now() - 5000,
      created_at: Date.now() - 10000,
    };

    await testDb.cameras.add(localCamera);

    // Add a pending sync queue entry for this camera
    await testDb._syncQueue.add({
      table: "cameras",
      entity_id: "01HTEST0000000000000000001",
      operation: "update",
      status: "pending",
      retry_count: 0,
      last_attempt: null,
      payload: null,
    });

    // Server has a newer version
    const serverCameras = [
      {
        id: "01HTEST0000000000000000001",
        user_id: "user-123",
        name: "Server Name",
        make: "Nikon",
        format: "35mm",
        default_frame_count: 36,
        notes: null,
        deleted_at: null,
        updated_at: "2024-01-15T10:00:00.000Z",
        created_at: "2024-01-10T08:00:00.000Z",
      },
    ];

    const mockSupabase = createMockTableSupabase({
      cameras: serverCameras,
      lenses: [],
      films: [],
      rolls: [],
      frames: [],
    });

    const result = await processDownloadSync(mockSupabase as never);

    expect(result.conflicts).toBe(1);
    expect(result.downloaded).toBe(1);

    // Verify conflict was logged
    const conflicts = await testDb._syncConflicts.toArray();
    expect(conflicts).toHaveLength(1);
    expect(conflicts[0].table).toBe("cameras");
    expect(conflicts[0].entity_id).toBe("01HTEST0000000000000000001");
    expect(conflicts[0].resolved_by).toBe("server_wins");
    expect((conflicts[0].local_data as Record<string, unknown>).name).toBe("Local Name");
    expect((conflicts[0].server_data as Record<string, unknown>).name).toBe("Server Name");

    // Verify stale queue entry was removed
    const queueEntries = await testDb._syncQueue.toArray();
    expect(queueEntries).toHaveLength(0);

    // Verify server data won (camera was overwritten)
    const cam = await testDb.cameras.get("01HTEST0000000000000000001");
    expect(cam!.name).toBe("Server Name");
  });

  it("detects conflicts for failed queue entries (not just pending)", async () => {
    // Local frame with a FAILED queue entry (e.g. delete that failed 5 times)
    const localFrame = {
      id: "01HTEST_FRAME_FAILED_000001",
      roll_id: "01HTEST_ROLL_000000000000001",
      frame_number: 4,
      shutter_speed: "1/125",
      aperture: 8,
      lens_id: null,
      metering_mode: null,
      exposure_comp: null,
      filter: null,
      latitude: null,
      longitude: null,
      location_name: null,
      notes: null,
      thumbnail: null,
      image_url: null,
      captured_at: Date.now(),
      deleted_at: Date.now(), // locally deleted
      updated_at: Date.now() - 5000,
      created_at: Date.now() - 10000,
    };

    await testDb.frames.add(localFrame);

    // Add a FAILED sync queue entry (delete that exhausted retries)
    await testDb._syncQueue.add({
      table: "frames",
      entity_id: "01HTEST_FRAME_FAILED_000001",
      operation: "delete",
      status: "failed",
      retry_count: 5,
      last_attempt: Date.now() - 60000,
      payload: null,
    });

    // Server still has this frame (delete never reached the server)
    const serverFrames = [
      {
        id: "01HTEST_FRAME_FAILED_000001",
        roll_id: "01HTEST_ROLL_000000000000001",
        frame_number: 4,
        shutter_speed: "1/125",
        aperture: 8,
        lens_id: null,
        metering_mode: null,
        exposure_comp: null,
        filter: null,
        latitude: null,
        longitude: null,
        location_name: null,
        notes: "Server version",
        thumbnail: null,
        image_url: null,
        captured_at: "2024-01-15T10:00:00.000Z",
        deleted_at: null,
        updated_at: "2024-01-16T12:00:00.000Z",
        created_at: "2024-01-10T08:00:00.000Z",
      },
    ];

    const mockSupabase = createMockTableSupabase({
      cameras: [],
      lenses: [],
      films: [],
      rolls: [],
      frames: serverFrames,
    });

    const result = await processDownloadSync(mockSupabase as never);

    // Should detect a conflict because of the failed queue entry
    expect(result.conflicts).toBe(1);

    // Verify conflict was logged
    const conflicts = await testDb._syncConflicts.toArray();
    expect(conflicts).toHaveLength(1);
    expect(conflicts[0].table).toBe("frames");
    expect(conflicts[0].entity_id).toBe("01HTEST_FRAME_FAILED_000001");
  });

  it("preserves local thumbnail on frame download", async () => {
    const thumbnailBlob = new Uint8Array([10, 20, 30]);

    // Local frame with a thumbnail
    await testDb.frames.add({
      id: "01HTEST_FRAME_00000000000001",
      roll_id: "01HTEST_ROLL_000000000000001",
      frame_number: 1,
      shutter_speed: "1/125",
      aperture: 8,
      lens_id: null,
      metering_mode: null,
      exposure_comp: null,
      filter: null,
      latitude: null,
      longitude: null,
      location_name: null,
      notes: null,
      thumbnail: thumbnailBlob,
      image_url: null,
      captured_at: Date.now(),
      updated_at: Date.now() - 10000,
      created_at: Date.now() - 20000,
    });

    // Server sends updated frame without thumbnail
    const serverFrames = [
      {
        id: "01HTEST_FRAME_00000000000001",
        roll_id: "01HTEST_ROLL_000000000000001",
        frame_number: 1,
        shutter_speed: "1/125",
        aperture: 8,
        lens_id: null,
        metering_mode: null,
        exposure_comp: null,
        filter: null,
        latitude: 40.7128,
        longitude: -74.006,
        location_name: "NYC",
        notes: "Updated from server",
        image_url: null,
        captured_at: "2024-01-15T10:00:00.000Z",
        updated_at: "2024-01-16T12:00:00.000Z",
        created_at: "2024-01-10T08:00:00.000Z",
      },
    ];

    const mockSupabase = createMockTableSupabase({
      cameras: [],
      lenses: [],
      films: [],
      rolls: [],
      frames: serverFrames,
    });

    await processDownloadSync(mockSupabase as never);

    // Verify thumbnail was preserved
    const frame = await testDb.frames.get("01HTEST_FRAME_00000000000001");
    expect(frame).toBeDefined();
    // Dexie may store Uint8Array as ArrayBuffer, so compare byte content
    expect(frame!.thumbnail).toBeTruthy();
    const stored = new Uint8Array(
      frame!.thumbnail instanceof ArrayBuffer
        ? frame!.thumbnail
        : (frame!.thumbnail as Uint8Array).buffer,
    );
    expect(Array.from(stored)).toEqual(Array.from(thumbnailBlob));
    expect(frame!.notes).toBe("Updated from server");
    expect(frame!.location_name).toBe("NYC");
  });

  it("handles empty download (no changes on server)", async () => {
    await testDb._syncMeta.put({
      key: "lastDownloadSync",
      value: "2024-01-15T00:00:00.000Z",
    });

    const mockSupabase = createMockTableSupabase({
      cameras: [],
      lenses: [],
      films: [],
      rolls: [],
      frames: [],
    });

    const result = await processDownloadSync(mockSupabase as never);

    expect(result.downloaded).toBe(0);
    expect(result.conflicts).toBe(0);

    // Watermark should remain unchanged
    const meta = await testDb._syncMeta.get("lastDownloadSync");
    expect(meta!.value).toBe("2024-01-15T00:00:00.000Z");
  });

  it("downloads multiple tables in sequence", async () => {
    const serverCameras = [
      {
        id: "01HTEST0000000000000000001",
        user_id: "user-123",
        name: "Camera",
        make: "Nikon",
        format: "35mm",
        default_frame_count: 36,
        notes: null,
        deleted_at: null,
        updated_at: "2024-01-15T10:00:00.000Z",
        created_at: "2024-01-10T08:00:00.000Z",
      },
    ];

    const serverLenses = [
      {
        id: "01HTEST0000000000000000002",
        user_id: "user-123",
        camera_id: null,
        name: "Lens",
        make: "Nikon",
        focal_length: 50,
        max_aperture: 1.4,
        deleted_at: null,
        updated_at: "2024-01-15T11:00:00.000Z",
        created_at: "2024-01-10T08:00:00.000Z",
      },
    ];

    const mockSupabase = createMockTableSupabase({
      cameras: serverCameras,
      lenses: serverLenses,
      films: [],
      rolls: [],
      frames: [],
    });

    const result = await processDownloadSync(mockSupabase as never);

    expect(result.downloaded).toBe(2);

    const cam = await testDb.cameras.get("01HTEST0000000000000000001");
    expect(cam).toBeDefined();

    const lens = await testDb.lenses.get("01HTEST0000000000000000002");
    expect(lens).toBeDefined();
  });
});

// ---------- Helpers ----------

/**
 * Creates a chainable mock that mirrors the Supabase query builder pattern:
 * select() → [gt()] → order() → range() → Promise<{data, error}>
 */
function createMockDownloadSupabase(
  data: Record<string, unknown>[] | null,
  error?: { message: string; code: string },
) {
  let gtCalled = false;
  let gtArgs: [string, string] | null = null;

  const rangeFn = vi.fn().mockResolvedValue({
    data: error ? null : data,
    error: error ?? null,
  });

  const orderFn = vi.fn().mockReturnValue({ range: rangeFn });

  const gtFn = vi.fn().mockImplementation((field: string, value: string) => {
    gtCalled = true;
    gtArgs = [field, value];
    return { order: orderFn };
  });

  const selectFn = vi.fn().mockReturnValue({
    gt: gtFn,
    order: orderFn,
  });

  const fromFn = vi.fn().mockReturnValue({ select: selectFn });

  return {
    from: fromFn,
    get _gtCalled() {
      return gtCalled;
    },
    get _gtArgs() {
      return gtArgs;
    },
  };
}

function createMockPaginatedSupabase(pages: Record<string, unknown>[][]) {
  let pageIndex = 0;

  const fromFn = vi.fn().mockImplementation(() => {
    const rangeFn = vi.fn().mockImplementation(() => {
      const currentPage = pages[pageIndex] ?? [];
      pageIndex++;
      return Promise.resolve({ data: currentPage, error: null });
    });

    const orderFn = vi.fn().mockReturnValue({ range: rangeFn });

    const selectFn = vi.fn().mockReturnValue({ order: orderFn });

    return { select: selectFn };
  });

  return { from: fromFn };
}

function createMockTableSupabase(
  tableData: Record<string, Record<string, unknown>[]>,
) {
  const gtCalls: Record<string, boolean> = {};

  const fromFn = vi.fn().mockImplementation((table: string) => {
    const data = tableData[table] ?? [];

    const rangeFn = vi.fn().mockResolvedValue({
      data,
      error: null,
    });

    const orderFn = vi.fn().mockReturnValue({ range: rangeFn });

    const gtFn = vi.fn().mockImplementation(() => {
      gtCalls[table] = true;
      return { order: orderFn };
    });

    const selectFn = vi.fn().mockReturnValue({
      gt: gtFn,
      order: orderFn,
    });

    return { select: selectFn };
  });

  return {
    from: fromFn,
    _gtCalls: gtCalls,
  };
}
