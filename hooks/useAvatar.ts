"use client";

import { useState, useEffect } from "react";
import { useDb } from "@/components/db-provider";
import { getLocalAvatar, migrateGlobalAvatar } from "@/lib/avatar";

/**
 * Loads the local avatar blob from IndexedDB and returns an object URL.
 * Returns null when no avatar is stored or userId is null.
 * Migrates the old global key on first load, then reads the user-scoped key.
 * Cleans up the URL on unmount.
 */
export function useAvatar(userId: string | null): string | null {
  const db = useDb();
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) return;

    let cancelled = false;
    let url: string | null = null;

    async function load() {
      await migrateGlobalAvatar(db, userId!);
      if (cancelled) return;
      const blob = await getLocalAvatar(db, userId!);
      if (cancelled) return;
      if (blob) {
        url = URL.createObjectURL(blob);
        setAvatarUrl(url);
      }
    }

    load();

    return () => {
      cancelled = true;
      if (url) {
        URL.revokeObjectURL(url);
      }
    };
  }, [userId, db]);

  return avatarUrl;
}
