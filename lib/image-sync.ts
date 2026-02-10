import { db } from "./db";
import { syncUpdate } from "./sync-write";
import type { SupabaseClient } from "@supabase/supabase-js";

const STORAGE_BUCKET = "reference-images";

/**
 * Compress an image blob using Canvas API (zero dependencies).
 * Scales proportionally if either dimension exceeds maxDimension.
 * Returns a compressed JPEG Blob.
 */
export async function compressImage(
  blob: Blob,
  maxDimension: number,
  quality: number,
): Promise<Blob> {
  const url = URL.createObjectURL(blob);

  try {
    const img = new Image();
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = () => reject(new Error("Failed to load image"));
      img.src = url;
    });

    let { width, height } = img;

    // Scale proportionally if needed
    if (width > maxDimension || height > maxDimension) {
      if (width > height) {
        height = Math.round((height / width) * maxDimension);
        width = maxDimension;
      } else {
        width = Math.round((width / height) * maxDimension);
        height = maxDimension;
      }
    }

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Failed to get canvas 2d context");
    ctx.drawImage(img, 0, 0, width, height);

    return await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (result) => {
          if (result) resolve(result);
          else reject(new Error("canvas.toBlob returned null"));
        },
        "image/jpeg",
        quality,
      );
    });
  } finally {
    URL.revokeObjectURL(url);
  }
}

/**
 * Convert a thumbnail value (Blob, Uint8Array, ArrayBuffer) to a Blob.
 * Also handles deserialized Blob-like objects from IndexedDB structured clone.
 */
export function toBlob(value: unknown): Blob | null {
  if (value instanceof Blob) return value;
  if (ArrayBuffer.isView(value)) {
    // .slice() always returns ArrayBuffer; cast needed for TS 5.9 strict ArrayBufferLike
    const ab = value.buffer.slice(
      value.byteOffset,
      value.byteOffset + value.byteLength,
    ) as ArrayBuffer;
    return new Blob([ab], { type: "image/jpeg" });
  }
  if (value instanceof ArrayBuffer)
    return new Blob([value], { type: "image/jpeg" });
  // Handle Blob-like objects that lost identity through structured clone
  if (value && typeof value === "object" && typeof (value as Blob).arrayBuffer === "function") {
    return value as Blob;
  }
  return null;
}

/**
 * Upload local thumbnails to Supabase Storage for frames that have
 * a thumbnail but no image_url. Sets image_url via syncUpdate so the
 * path reaches the server's frames table.
 *
 * @returns Number of successfully uploaded images.
 */
export async function processImageUpload(
  supabase: SupabaseClient,
  userId: string,
): Promise<number> {
  const frames = await db.frames.toArray();
  const needUpload = frames.filter((f) => f.thumbnail && !f.image_url);

  let successCount = 0;

  for (const frame of needUpload) {
    try {
      const blob = toBlob(frame.thumbnail);
      if (!blob) continue;

      const compressed = await compressImage(blob, 2048, 0.8);
      const path = `${userId}/${frame.roll_id}/${frame.id}.jpg`;

      const { error } = await supabase.storage
        .from(STORAGE_BUCKET)
        .upload(path, compressed, {
          contentType: "image/jpeg",
          upsert: true,
        });

      if (error) {
        console.warn(
          `Image upload failed for frame ${frame.id}:`,
          error.message,
        );
        continue;
      }

      // Update image_url and enqueue sync so the path reaches the server
      await syncUpdate("frames", frame.id, { image_url: path });
      successCount++;
    } catch (err) {
      console.warn(
        `Image upload error for frame ${frame.id}:`,
        err,
      );
    }
  }

  return successCount;
}

/**
 * Download images from Supabase Storage for frames that have an
 * image_url but no local thumbnail. Writes directly to Dexie
 * (no sync queue entry, since thumbnail is local-only).
 *
 * @returns Number of successfully downloaded images.
 */
export async function processImageDownload(
  supabase: SupabaseClient,
): Promise<number> {
  const frames = await db.frames.toArray();
  const needDownload = frames.filter((f) => f.image_url && !f.thumbnail);

  let successCount = 0;

  for (const frame of needDownload) {
    try {
      const { data, error } = await supabase.storage
        .from(STORAGE_BUCKET)
        .download(frame.image_url!);

      if (error || !data) {
        console.warn(
          `Image download failed for frame ${frame.id}:`,
          error?.message,
        );
        continue;
      }

      // Compress for local storage (smaller than upload)
      const compressed = await compressImage(data, 1024, 0.6);

      // Direct Dexie write — thumbnail is local-only, no sync queue
      await db.frames.update(frame.id, { thumbnail: compressed });
      successCount++;
    } catch (err) {
      console.warn(
        `Image download error for frame ${frame.id}:`,
        err,
      );
    }
  }

  return successCount;
}

/**
 * Generate a signed URL for a private storage image.
 * Returns the URL string or null on error.
 */
export async function getSignedImageUrl(
  supabase: SupabaseClient,
  path: string,
  expiresIn?: number,
): Promise<string | null> {
  const { data, error } = await supabase.storage
    .from(STORAGE_BUCKET)
    .createSignedUrl(path, expiresIn ?? 3600);

  if (error || !data?.signedUrl) return null;
  return data.signedUrl;
}
