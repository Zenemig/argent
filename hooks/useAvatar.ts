"use client";

import { useState, useEffect } from "react";
import { getLocalAvatar, migrateGlobalAvatar } from "@/lib/avatar";

/**
 * Loads the local avatar blob from IndexedDB and returns an object URL.
 * Returns null when no avatar is stored or userId is null.
 * Migrates the old global key on first load, then reads the user-scoped key.
 * Cleans up the URL on unmount.
 */
export function useAvatar(userId: string | null): string | null {
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) return;

    let url: string | null = null;

    async function load() {
      await migrateGlobalAvatar(userId!);
      const blob = await getLocalAvatar(userId!);
      if (blob) {
        url = URL.createObjectURL(blob);
        setAvatarUrl(url);
      }
    }

    load();

    return () => {
      if (url) {
        URL.revokeObjectURL(url);
      }
    };
  }, [userId]);

  return avatarUrl;
}
