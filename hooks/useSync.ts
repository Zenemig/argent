"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/lib/db";
import { processDownloadSync, processUploadQueue } from "@/lib/sync-engine";
import { createClient } from "@/lib/supabase/client";
import { GUEST_USER_ID } from "@/lib/guest";

export type SyncState = "synced" | "syncing" | "offline" | "error" | "local-only";

interface UseSyncResult {
  syncState: SyncState;
  failedCount: number;
  syncNow: () => Promise<void>;
}

/**
 * Orchestrates upload sync: monitors connectivity, processes the queue
 * on online/foreground events, and exposes reactive sync state.
 */
export function useSync(userId: string): UseSyncResult {
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== "undefined" ? navigator.onLine : true,
  );
  const [isSyncing, setIsSyncing] = useState(false);
  const syncInProgressRef = useRef(false);

  // Reactively watch queue counts
  const queueStats = useLiveQuery(async () => {
    const pending = await db._syncQueue
      .where("status")
      .anyOf("pending", "in_progress")
      .count();
    const failed = await db._syncQueue
      .where("status")
      .equals("failed")
      .count();
    return { pending, failed };
  }, []);

  const pendingCount = queueStats?.pending ?? 0;
  const failedCount = queueStats?.failed ?? 0;

  const isGuest = userId === GUEST_USER_ID;

  const runSync = useCallback(async () => {
    if (isGuest || syncInProgressRef.current || !navigator.onLine) return;

    syncInProgressRef.current = true;
    setIsSyncing(true);

    try {
      const supabase = createClient();
      // Download first: resolve server-wins conflicts before uploading
      await processDownloadSync(supabase);
      await processUploadQueue(supabase);

      // Image sync (dynamic import to keep out of initial bundle)
      try {
        const { processImageUpload, processImageDownload } = await import(
          "@/lib/image-sync"
        );
        await processImageUpload(supabase, userId);
        await processImageDownload(supabase);
      } catch {
        // Image sync failure should not break data sync state
      }
    } finally {
      syncInProgressRef.current = false;
      setIsSyncing(false);
    }
  }, [isGuest, userId]);

  // Online/offline listeners
  useEffect(() => {
    function handleOnline() {
      setIsOnline(true);
      runSync();
    }
    function handleOffline() {
      setIsOnline(false);
    }

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [runSync]);

  // Visibility change (iOS foreground resume)
  useEffect(() => {
    function handleVisibility() {
      if (document.visibilityState === "visible") {
        runSync();
      }
    }

    document.addEventListener("visibilitychange", handleVisibility);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [runSync]);

  // Initial sync on mount (if online + authenticated)
  useEffect(() => {
    runSync();
  }, [runSync]);

  // Derive sync state
  let syncState: SyncState;
  if (isGuest) {
    syncState = "local-only";
  } else if (!isOnline) {
    syncState = "offline";
  } else if (isSyncing) {
    syncState = "syncing";
  } else if (failedCount > 0) {
    syncState = "error";
  } else if (pendingCount === 0) {
    syncState = "synced";
  } else {
    syncState = "syncing";
  }

  return {
    syncState,
    failedCount,
    syncNow: runSync,
  };
}
