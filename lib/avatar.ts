import { db } from "./db";
import type { SupabaseClient } from "@supabase/supabase-js";

const STORAGE_BUCKET = "reference-images";
const AVATAR_META_KEY = "avatarBlob";

/**
 * Read the local avatar blob from IndexedDB (_syncMeta table).
 */
export async function getLocalAvatar(): Promise<Blob | null> {
  const row = await db._syncMeta.get(AVATAR_META_KEY);
  return (row?.value as unknown as Blob) ?? null;
}

/**
 * Save an avatar blob to local IndexedDB.
 */
export async function setLocalAvatar(blob: Blob): Promise<void> {
  await db._syncMeta.put({ key: AVATAR_META_KEY, value: blob as never });
}

/**
 * Remove the local avatar blob from IndexedDB.
 */
export async function removeLocalAvatar(): Promise<void> {
  await db._syncMeta.delete(AVATAR_META_KEY);
}

/**
 * Compress and upload avatar to Supabase Storage, then update user_profiles.avatar_url.
 * Returns the storage path on success, null on failure.
 */
export async function uploadAvatar(
  supabase: SupabaseClient,
  userId: string,
  blob: Blob,
): Promise<string | null> {
  const { compressImage } = await import("./image-sync");
  const compressed = await compressImage(blob, 256, 0.8);
  const path = `${userId}/avatar.jpg`;

  const { error: uploadError } = await supabase.storage
    .from(STORAGE_BUCKET)
    .upload(path, compressed, {
      contentType: "image/jpeg",
      upsert: true,
    });

  if (uploadError) {
    console.warn("Avatar upload failed:", uploadError.message);
    return null;
  }

  const { error: updateError } = await supabase
    .from("user_profiles")
    .update({ avatar_url: path })
    .eq("id", userId);

  if (updateError) {
    console.warn("Avatar profile update failed:", updateError.message);
  }

  return path;
}

/**
 * Download avatar blob from Supabase Storage.
 */
export async function downloadAvatar(
  supabase: SupabaseClient,
  avatarPath: string,
): Promise<Blob | null> {
  const { data, error } = await supabase.storage
    .from(STORAGE_BUCKET)
    .download(avatarPath);

  if (error || !data) {
    console.warn("Avatar download failed:", error?.message);
    return null;
  }

  return data;
}
