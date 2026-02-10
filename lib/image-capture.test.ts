import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// ---------------------------------------------------------------------------
// Mock compressImage from image-sync (dynamic-imported by captureImage)
// ---------------------------------------------------------------------------
const mockCompressImage = vi.fn();
vi.mock("./image-sync", () => ({
  compressImage: (...args: unknown[]) => mockCompressImage(...args),
}));

// Mock URL.createObjectURL / revokeObjectURL (needed by compressImage internally)
globalThis.URL.createObjectURL = vi.fn(() => "blob:mock-url");
globalThis.URL.revokeObjectURL = vi.fn();

import { captureImage } from "./image-capture";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Simulate selecting a file via the hidden input that captureImage creates.
 * We intercept document.body.appendChild to find the input and fire events.
 */
function setupFileInputInterceptor(options: {
  file?: File | null;
  cancel?: boolean;
}) {
  const originalAppendChild = document.body.appendChild.bind(document.body);
  const spy = vi
    .spyOn(document.body, "appendChild")
    .mockImplementation((node: Node) => {
      const result = originalAppendChild(node);
      if (
        node instanceof HTMLInputElement &&
        node.type === "file"
      ) {
        // Defer to let captureImage's event listeners attach
        setTimeout(() => {
          if (options.cancel) {
            node.dispatchEvent(new Event("cancel"));
          } else if (options.file) {
            // Create a FileList-like object
            Object.defineProperty(node, "files", {
              value: [options.file],
              configurable: true,
            });
            node.dispatchEvent(new Event("change"));
          } else {
            // No file selected
            Object.defineProperty(node, "files", {
              value: [],
              configurable: true,
            });
            node.dispatchEvent(new Event("change"));
          }
        }, 0);
      }
      return result;
    });
  return spy;
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("captureImage", () => {
  beforeEach(() => {
    mockCompressImage.mockClear();
    mockCompressImage.mockResolvedValue(
      new Blob(["compressed"], { type: "image/jpeg" }),
    );
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("returns compressed blob on successful capture", async () => {
    const file = new File(["image-data"], "photo.jpg", {
      type: "image/jpeg",
    });
    const spy = setupFileInputInterceptor({ file });

    const result = await captureImage();
    spy.mockRestore();

    expect("blob" in result).toBe(true);
    if ("blob" in result) {
      expect(result.blob).toBeInstanceOf(Blob);
    }
  });

  it("calls compressImage with default params", async () => {
    const file = new File(["image-data"], "photo.jpg", {
      type: "image/jpeg",
    });
    const spy = setupFileInputInterceptor({ file });

    await captureImage();
    spy.mockRestore();

    expect(mockCompressImage).toHaveBeenCalledWith(file, 1024, 0.6);
  });

  it("passes custom maxDimension and quality", async () => {
    const file = new File(["image-data"], "photo.jpg", {
      type: "image/jpeg",
    });
    const spy = setupFileInputInterceptor({ file });

    await captureImage(2048, 0.8);
    spy.mockRestore();

    expect(mockCompressImage).toHaveBeenCalledWith(file, 2048, 0.8);
  });

  it("returns no_file error when picker is cancelled", async () => {
    const spy = setupFileInputInterceptor({ cancel: true });

    const result = await captureImage();
    spy.mockRestore();

    expect(result).toEqual({ error: "no_file" });
  });

  it("returns no_file error when no file is selected", async () => {
    const spy = setupFileInputInterceptor({ file: null });

    const result = await captureImage();
    spy.mockRestore();

    expect(result).toEqual({ error: "no_file" });
  });

  it("returns invalid_type error for non-image files", async () => {
    const file = new File(["data"], "doc.pdf", { type: "application/pdf" });
    const spy = setupFileInputInterceptor({ file });

    const result = await captureImage();
    spy.mockRestore();

    expect(result).toEqual({ error: "invalid_type" });
    expect(mockCompressImage).not.toHaveBeenCalled();
  });

  it("returns compression_failed error when compressImage throws", async () => {
    mockCompressImage.mockRejectedValue(new Error("Canvas error"));

    const file = new File(["image-data"], "photo.jpg", {
      type: "image/jpeg",
    });
    const spy = setupFileInputInterceptor({ file });

    const result = await captureImage();
    spy.mockRestore();

    expect(result).toEqual({ error: "compression_failed" });
  });

  it("creates input with accept=image/*", async () => {
    const file = new File(["img"], "p.jpg", { type: "image/jpeg" });
    let capturedInput: HTMLInputElement | null = null;

    const originalAppendChild = document.body.appendChild.bind(document.body);
    const spy = vi
      .spyOn(document.body, "appendChild")
      .mockImplementation((node: Node) => {
        const result = originalAppendChild(node);
        if (node instanceof HTMLInputElement && node.type === "file") {
          capturedInput = node;
          setTimeout(() => {
            Object.defineProperty(node, "files", {
              value: [file],
              configurable: true,
            });
            node.dispatchEvent(new Event("change"));
          }, 0);
        }
        return result;
      });

    await captureImage();
    spy.mockRestore();

    expect(capturedInput).not.toBeNull();
    expect(capturedInput!.accept).toBe("image/*");
  });

  it("removes input from DOM after capture", async () => {
    const file = new File(["img"], "p.jpg", { type: "image/jpeg" });
    const spy = setupFileInputInterceptor({ file });

    await captureImage();
    spy.mockRestore();

    const inputs = document.querySelectorAll('input[type="file"]');
    expect(inputs.length).toBe(0);
  });

  it("removes input from DOM after cancel", async () => {
    const spy = setupFileInputInterceptor({ cancel: true });

    await captureImage();
    spy.mockRestore();

    const inputs = document.querySelectorAll('input[type="file"]');
    expect(inputs.length).toBe(0);
  });
});
