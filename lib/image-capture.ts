/**
 * Image Capture Utility
 *
 * Creates a hidden file input, triggers the native picker (camera + gallery),
 * and compresses the selected image via dynamic import of compressImage.
 * Returns a compressed Blob or an error code for i18n.
 */

export type CaptureResult =
  | { blob: Blob }
  | { error: "no_file" | "invalid_type" | "compression_failed" };

/**
 * Open the native file picker for images. Compresses the selected image
 * to a JPEG thumbnail suitable for IndexedDB storage.
 *
 * @param maxDimension - Max width/height in pixels (default 1024)
 * @param quality - JPEG quality 0-1 (default 0.6)
 */
let captureInProgress = false;

export function captureImage(
  maxDimension = 1024,
  quality = 0.6,
): Promise<CaptureResult> {
  if (captureInProgress) {
    return Promise.resolve({ error: "no_file" });
  }
  captureInProgress = true;

  return new Promise((resolve) => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.style.display = "none";

    function cleanup() {
      captureInProgress = false;
      if (input.parentNode) {
        input.parentNode.removeChild(input);
      }
    }

    input.addEventListener(
      "change",
      async () => {
        const file = input.files?.[0];

        if (!file) {
          cleanup();
          resolve({ error: "no_file" });
          return;
        }

        if (!file.type.startsWith("image/")) {
          cleanup();
          resolve({ error: "invalid_type" });
          return;
        }

        try {
          const { compressImage } = await import("./image-sync");
          const blob = await compressImage(file, maxDimension, quality);
          cleanup();
          resolve({ blob });
        } catch (err) {
          console.error("Image compression failed:", err);
          cleanup();
          resolve({ error: "compression_failed" });
        }
      },
      { once: true },
    );

    // Handle cancel (user closes picker without selecting)
    input.addEventListener(
      "cancel",
      () => {
        cleanup();
        resolve({ error: "no_file" });
      },
      { once: true },
    );

    document.body.appendChild(input);
    input.click();
  });
}
