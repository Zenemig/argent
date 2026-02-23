import type { ArgentDb } from "./db";
import type { SupabaseClient } from "@supabase/supabase-js";

const STORAGE_BUCKET = "reference-images";
const AVATAR_KEY_PREFIX = "avatarBlob";
// The legacy (pre-isolation) global key was the bare prefix with no user scope
const GLOBAL_AVATAR_KEY = AVATAR_KEY_PREFIX;

function avatarKey(userId: string): string {
  return `${AVATAR_KEY_PREFIX}:${userId}`;
}

/**
 * Read the local avatar blob from IndexedDB (_syncMeta table).
 */
export async function getLocalAvatar(db: ArgentDb, userId: string): Promise<Blob | null> {
  const row = await db._syncMeta.get(avatarKey(userId));
  return (row?.value as unknown as Blob) ?? null;
}

/**
 * Save an avatar blob to local IndexedDB, scoped to the user.
 */
export async function setLocalAvatar(db: ArgentDb, userId: string, blob: Blob): Promise<void> {
  await db._syncMeta.put({ key: avatarKey(userId), value: blob as never });
}

/**
 * Remove the local avatar blob from IndexedDB.
 */
export async function removeLocalAvatar(db: ArgentDb, userId: string): Promise<void> {
  await db._syncMeta.delete(avatarKey(userId));
}

/**
 * Migrate the old global "avatarBlob" key to the user-scoped key.
 * Called once on load to handle existing users who upgraded.
 * Also cleans up the global key to prevent cross-user leakage.
 */
export async function migrateGlobalAvatar(db: ArgentDb, userId: string): Promise<void> {
  const globalRow = await db._syncMeta.get(GLOBAL_AVATAR_KEY);
  if (!globalRow) return;

  // Only copy if user doesn't already have a scoped avatar
  const scopedRow = await db._syncMeta.get(avatarKey(userId));
  if (!scopedRow) {
    await db._syncMeta.put({
      key: avatarKey(userId),
      value: globalRow.value,
    });
  }

  // Always clean up the global key
  await db._syncMeta.delete(GLOBAL_AVATAR_KEY);
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
