import { describe, it, expect, beforeEach, vi } from "vitest";
import "fake-indexeddb/auto";
import { ArgentDb } from "./db";
import type { Frame } from "./types";

// ---------------------------------------------------------------------------
// Mock db module so image-sync uses our test db
// ---------------------------------------------------------------------------
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

// Mock sync-write so we can verify syncUpdate calls without side effects
const mockSyncUpdate = vi.fn();
vi.mock("./sync-write", () => ({
  syncUpdate: (...args: unknown[]) => mockSyncUpdate(...args),
}));

// ---------------------------------------------------------------------------
// Mock Canvas API (jsdom doesn't support it)
// ---------------------------------------------------------------------------
let mockImageWidth = 800;
let mockImageHeight = 600;

class MockImage {
  width = 0;
  height = 0;
  onload: (() => void) | null = null;
  onerror: (() => void) | null = null;

  set src(_url: string) {
    // Simulate async load
    setTimeout(() => {
      this.width = mockImageWidth;
      this.height = mockImageHeight;
      this.onload?.();
    }, 0);
  }
}

vi.stubGlobal("Image", MockImage);

// Track canvas calls
let lastCanvasWidth = 0;
let lastCanvasHeight = 0;
let lastToBlobType = "";
let lastToBlobQuality = 0;
const mockDrawImage = vi.fn();

const mockGetContext = vi.fn().mockReturnValue({
  drawImage: mockDrawImage,
});

const mockToBlob = vi.fn().mockImplementation(
  (callback: (blob: Blob | null) => void, type: string, quality: number) => {
    lastToBlobType = type;
    lastToBlobQuality = quality;
    callback(new Blob(["compressed"], { type: "image/jpeg" }));
  },
);

vi.spyOn(document, "createElement").mockImplementation((tag: string) => {
  if (tag === "canvas") {
    const canvas = {
      width: 0,
      height: 0,
      getContext: mockGetContext,
      toBlob: mockToBlob,
    };
    // Track dimensions via setter
    return new Proxy(canvas, {
      set(target, prop, value) {
        if (prop === "width") lastCanvasWidth = value as number;
        if (prop === "height") lastCanvasHeight = value as number;
        (target as Record<string, unknown>)[prop as string] = value;
        return true;
      },
    }) as unknown as HTMLElement;
  }
  return document.createElement.call(document, tag) as HTMLElement;
});

// Mock URL.createObjectURL / revokeObjectURL
const mockCreateObjectURL = vi.fn(() => "blob:mock-url");
const mockRevokeObjectURL = vi.fn();
globalThis.URL.createObjectURL = mockCreateObjectURL;
globalThis.URL.revokeObjectURL = mockRevokeObjectURL;

// Import after mocks
const { compressImage, processImageUpload, processImageDownload, getSignedImageUrl } =
  await import("./image-sync");

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeFrame(overrides: Partial<Frame> = {}): Frame {
  return {
    id: "01HTEST0000000000000000001",
    roll_id: "01HTEST0000000000000ROLL01",
    frame_number: 1,
    shutter_speed: "1/125",
    aperture: 5.6,
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
    updated_at: Date.now(),
    created_at: Date.now(),
    ...overrides,
  };
}

function createMockSupabaseStorage(options: {
  uploadError?: { message: string };
  downloadError?: { message: string };
  downloadData?: Blob | null;
  signedUrlError?: { message: string };
  signedUrl?: string;
} = {}) {
  const uploadFn = vi.fn().mockResolvedValue({
    data: options.uploadError ? null : { path: "mock/path.jpg" },
    error: options.uploadError ?? null,
  });

  const downloadFn = vi.fn().mockResolvedValue({
    data: options.downloadError ? null : (options.downloadData ?? new Blob(["image-data"])),
    error: options.downloadError ?? null,
  });

  const createSignedUrlFn = vi.fn().mockResolvedValue({
    data: options.signedUrlError ? null : { signedUrl: options.signedUrl ?? "https://signed.example.com/image.jpg" },
    error: options.signedUrlError ?? null,
  });

  const fromFn = vi.fn().mockReturnValue({
    upload: uploadFn,
    download: downloadFn,
    createSignedUrl: createSignedUrlFn,
  });

  return {
    storage: { from: fromFn },
    _mocks: { uploadFn, downloadFn, createSignedUrlFn, fromFn },
  };
}

// ---------------------------------------------------------------------------
// compressImage
// ---------------------------------------------------------------------------

describe("compressImage", () => {
  beforeEach(() => {
    mockImageWidth = 800;
    mockImageHeight = 600;
    mockDrawImage.mockClear();
    mockGetContext.mockClear();
    mockToBlob.mockClear();
    lastCanvasWidth = 0;
    lastCanvasHeight = 0;
  });

  it("creates Image element and loads the blob URL", async () => {
    const blob = new Blob(["test"], { type: "image/jpeg" });
    await compressImage(blob, 2048, 0.8);

    expect(mockCreateObjectURL).toHaveBeenCalledWith(blob);
    expect(mockRevokeObjectURL).toHaveBeenCalledWith("blob:mock-url");
  });

  it("does not scale when image is smaller than maxDimension", async () => {
    mockImageWidth = 400;
    mockImageHeight = 300;
    const blob = new Blob(["test"], { type: "image/jpeg" });
    await compressImage(blob, 2048, 0.8);

    expect(lastCanvasWidth).toBe(400);
    expect(lastCanvasHeight).toBe(300);
  });

  it("scales landscape images correctly", async () => {
    mockImageWidth = 4000;
    mockImageHeight = 3000;
    const blob = new Blob(["test"], { type: "image/jpeg" });
    await compressImage(blob, 2048, 0.8);

    expect(lastCanvasWidth).toBe(2048);
    expect(lastCanvasHeight).toBe(1536); // 3000/4000 * 2048
  });

  it("scales portrait images correctly", async () => {
    mockImageWidth = 3000;
    mockImageHeight = 4000;
    const blob = new Blob(["test"], { type: "image/jpeg" });
    await compressImage(blob, 2048, 0.8);

    expect(lastCanvasWidth).toBe(1536); // 3000/4000 * 2048
    expect(lastCanvasHeight).toBe(2048);
  });

  it("calls toBlob with correct MIME type and quality", async () => {
    const blob = new Blob(["test"], { type: "image/jpeg" });
    await compressImage(blob, 2048, 0.8);

    expect(lastToBlobType).toBe("image/jpeg");
    expect(lastToBlobQuality).toBe(0.8);
  });

  it("returns a Blob", async () => {
    const blob = new Blob(["test"], { type: "image/jpeg" });
    const result = await compressImage(blob, 2048, 0.8);

    expect(result).toBeInstanceOf(Blob);
  });
});

// ---------------------------------------------------------------------------
// processImageUpload
// ---------------------------------------------------------------------------

describe("processImageUpload", () => {
  beforeEach(async () => {
    if (testDb) await testDb.delete();
    testDb = new ArgentDb();
    await testDb.open();
    mockSyncUpdate.mockClear();
    mockSyncUpdate.mockResolvedValue(undefined);
  });

  it("returns 0 when no frames need upload", async () => {
    const supabase = createMockSupabaseStorage();
    const count = await processImageUpload(supabase as never, "user-1");
    expect(count).toBe(0);
  });

  it("skips frames that already have image_url", async () => {
    await testDb.frames.add(
      makeFrame({
        thumbnail: new Uint8Array([1, 2, 3]),
        image_url: "user-1/roll/frame.jpg",
      }),
    );

    const supabase = createMockSupabaseStorage();
    const count = await processImageUpload(supabase as never, "user-1");

    expect(count).toBe(0);
    expect(supabase._mocks.uploadFn).not.toHaveBeenCalled();
  });

  it("skips frames with null thumbnail", async () => {
    await testDb.frames.add(makeFrame({ thumbnail: null, image_url: null }));

    const supabase = createMockSupabaseStorage();
    const count = await processImageUpload(supabase as never, "user-1");

    expect(count).toBe(0);
  });

  it("uploads and sets image_url for qualifying frames", async () => {
    await testDb.frames.add(
      makeFrame({ thumbnail: new Uint8Array([1, 2, 3]), image_url: null }),
    );

    const supabase = createMockSupabaseStorage();
    const count = await processImageUpload(supabase as never, "user-1");

    expect(count).toBe(1);
    expect(supabase._mocks.uploadFn).toHaveBeenCalledWith(
      "user-1/01HTEST0000000000000ROLL01/01HTEST0000000000000000001.jpg",
      expect.any(Blob),
      { contentType: "image/jpeg", upsert: true },
    );
  });

  it("constructs correct storage path", async () => {
    const frame = makeFrame({
      id: "01HTEST00000000FRAME000002",
      roll_id: "01HTEST00000000ROLL0000002",
      thumbnail: new Uint8Array([1, 2, 3]),
      image_url: null,
    });
    await testDb.frames.add(frame);

    const supabase = createMockSupabaseStorage();
    await processImageUpload(supabase as never, "user-abc");

    expect(supabase._mocks.uploadFn).toHaveBeenCalledWith(
      "user-abc/01HTEST00000000ROLL0000002/01HTEST00000000FRAME000002.jpg",
      expect.any(Blob),
      expect.objectContaining({ upsert: true }),
    );
  });

  it("creates sync queue entry via syncUpdate", async () => {
    await testDb.frames.add(
      makeFrame({ thumbnail: new Uint8Array([1, 2, 3]), image_url: null }),
    );

    const supabase = createMockSupabaseStorage();
    await processImageUpload(supabase as never, "user-1");

    expect(mockSyncUpdate).toHaveBeenCalledWith(
      "frames",
      "01HTEST0000000000000000001",
      {
        image_url: "user-1/01HTEST0000000000000ROLL01/01HTEST0000000000000000001.jpg",
        updated_at: expect.any(Number),
      },
    );
  });

  it("continues after a single upload failure", async () => {
    const frame1 = makeFrame({
      id: "01HTEST0000000000000000001",
      thumbnail: new Uint8Array([1, 2, 3]),
      image_url: null,
    });
    const frame2 = makeFrame({
      id: "01HTEST0000000000000000002",
      thumbnail: new Uint8Array([4, 5, 6]),
      image_url: null,
    });
    await testDb.frames.bulkAdd([frame1, frame2]);

    // First call fails, second succeeds
    const uploadFn = vi
      .fn()
      .mockResolvedValueOnce({ data: null, error: { message: "fail" } })
      .mockResolvedValueOnce({ data: { path: "ok" }, error: null });

    const supabase = {
      storage: {
        from: vi.fn().mockReturnValue({ upload: uploadFn }),
      },
    };

    const count = await processImageUpload(supabase as never, "user-1");

    expect(count).toBe(1);
    expect(uploadFn).toHaveBeenCalledTimes(2);
  });

  it("uses upsert: true on storage upload", async () => {
    await testDb.frames.add(
      makeFrame({ thumbnail: new Uint8Array([1, 2, 3]), image_url: null }),
    );

    const supabase = createMockSupabaseStorage();
    await processImageUpload(supabase as never, "user-1");

    expect(supabase._mocks.uploadFn).toHaveBeenCalledWith(
      expect.any(String),
      expect.any(Blob),
      expect.objectContaining({ upsert: true }),
    );
  });
});

// ---------------------------------------------------------------------------
// processImageDownload
// ---------------------------------------------------------------------------

describe("processImageDownload", () => {
  beforeEach(async () => {
    if (testDb) await testDb.delete();
    testDb = new ArgentDb();
    await testDb.open();
    mockSyncUpdate.mockClear();
  });

  it("returns 0 when no frames need download", async () => {
    const supabase = createMockSupabaseStorage();
    const count = await processImageDownload(supabase as never);
    expect(count).toBe(0);
  });

  it("downloads and sets thumbnail for qualifying frames", async () => {
    await testDb.frames.add(
      makeFrame({
        thumbnail: null,
        image_url: "user-1/roll-1/frame-1.jpg",
      }),
    );

    const supabase = createMockSupabaseStorage({
      downloadData: new Blob(["image-data"], { type: "image/jpeg" }),
    });
    const count = await processImageDownload(supabase as never);

    expect(count).toBe(1);

    const frame = await testDb.frames.get("01HTEST0000000000000000001");
    expect(frame!.thumbnail).toBeTruthy();
  });

  it("does NOT create sync queue entry (direct Dexie write)", async () => {
    await testDb.frames.add(
      makeFrame({
        thumbnail: null,
        image_url: "user-1/roll-1/frame-1.jpg",
      }),
    );

    const supabase = createMockSupabaseStorage();
    await processImageDownload(supabase as never);

    expect(mockSyncUpdate).not.toHaveBeenCalled();
  });

  it("skips frames that already have thumbnail", async () => {
    await testDb.frames.add(
      makeFrame({
        thumbnail: new Uint8Array([7, 8, 9]),
        image_url: "user-1/roll-1/frame-1.jpg",
      }),
    );

    const supabase = createMockSupabaseStorage();
    const count = await processImageDownload(supabase as never);

    expect(count).toBe(0);
    expect(supabase._mocks.downloadFn).not.toHaveBeenCalled();
  });

  it("skips frames with null image_url", async () => {
    await testDb.frames.add(
      makeFrame({ thumbnail: null, image_url: null }),
    );

    const supabase = createMockSupabaseStorage();
    const count = await processImageDownload(supabase as never);

    expect(count).toBe(0);
  });

  it("continues after a single download failure", async () => {
    const frame1 = makeFrame({
      id: "01HTEST0000000000000000001",
      thumbnail: null,
      image_url: "user-1/roll-1/frame-1.jpg",
    });
    const frame2 = makeFrame({
      id: "01HTEST0000000000000000002",
      thumbnail: null,
      image_url: "user-1/roll-1/frame-2.jpg",
    });
    await testDb.frames.bulkAdd([frame1, frame2]);

    const downloadFn = vi
      .fn()
      .mockResolvedValueOnce({ data: null, error: { message: "fail" } })
      .mockResolvedValueOnce({ data: new Blob(["ok"]), error: null });

    const supabase = {
      storage: {
        from: vi.fn().mockReturnValue({ download: downloadFn }),
      },
    };

    const count = await processImageDownload(supabase as never);

    expect(count).toBe(1);
    expect(downloadFn).toHaveBeenCalledTimes(2);
  });
});

// ---------------------------------------------------------------------------
// getSignedImageUrl
// ---------------------------------------------------------------------------

describe("getSignedImageUrl", () => {
  it("returns signed URL on success", async () => {
    const supabase = createMockSupabaseStorage({
      signedUrl: "https://signed.example.com/img.jpg",
    });

    const url = await getSignedImageUrl(supabase as never, "user/roll/frame.jpg");

    expect(url).toBe("https://signed.example.com/img.jpg");
    expect(supabase._mocks.createSignedUrlFn).toHaveBeenCalledWith(
      "user/roll/frame.jpg",
      3600,
    );
  });

  it("returns null on error", async () => {
    const supabase = createMockSupabaseStorage({
      signedUrlError: { message: "Not found" },
    });

    const url = await getSignedImageUrl(supabase as never, "bad/path.jpg");

    expect(url).toBeNull();
  });

  it("accepts custom expiresIn", async () => {
    const supabase = createMockSupabaseStorage();

    await getSignedImageUrl(supabase as never, "path.jpg", 7200);

    expect(supabase._mocks.createSignedUrlFn).toHaveBeenCalledWith(
      "path.jpg",
      7200,
    );
  });
});
