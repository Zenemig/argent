"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/lib/db";
import { processDownloadSync, processUploadQueue } from "@/lib/sync-engine";
import { createClient } from "@/lib/supabase/client";

export type SyncState = "synced" | "syncing" | "offline" | "error" | "local-only";

interface UseSyncOptions {
  /** When false, skip all sync activity and return "local-only". Defaults to true. */
  enabled?: boolean;
}

interface UseSyncResult {
  syncState: SyncState;
  failedCount: number;
  pendingCount: number;
  lastError: string | null;
  syncNow: () => Promise<void>;
}

/**
 * Orchestrates upload sync: monitors connectivity, processes the queue
 * on online/foreground events, and exposes reactive sync state.
 */
export function useSync(userId: string | null, options?: UseSyncOptions): UseSyncResult {
  const enabled = options?.enabled ?? true;
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== "undefined" ? navigator.onLine : true,
  );
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastError, setLastError] = useState<string | null>(null);
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

  const shouldSkip = !userId || !enabled;

  const runSync = useCallback(async () => {
    if (shouldSkip || syncInProgressRef.current || !navigator.onLine) return;

    syncInProgressRef.current = true;
    setIsSyncing(true);

    try {
      const supabase = createClient();
      // Download first: resolve server-wins conflicts before uploading
      await processDownloadSync(supabase);
      await processUploadQueue(supabase);

      setLastError(null);

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

      // Avatar sync
      try {
        const { getLocalAvatar, uploadAvatar, downloadAvatar, setLocalAvatar } =
          await import("@/lib/avatar");
        const { getSetting, setSetting } = await import(
          "@/lib/settings-helpers"
        );

        const localAvatar = await getLocalAvatar(userId);
        const avatarUploaded = await getSetting("avatarUploaded");

        if (localAvatar && avatarUploaded !== "true") {
          // Upload local avatar that hasn't been synced yet
          const path = await uploadAvatar(supabase, userId, localAvatar);
          if (path) {
            await setSetting("avatarUploaded", "true");
          }
        } else if (!localAvatar) {
          // Download avatar from server if we don't have one locally
          const { data: profile } = await supabase
            .from("user_profiles")
            .select("avatar_url")
            .eq("id", userId)
            .single();

          if (profile?.avatar_url) {
            const blob = await downloadAvatar(supabase, profile.avatar_url);
            if (blob) {
              await setLocalAvatar(userId, blob);
              await setSetting("avatarUploaded", "true");
            }
          }
        }
      } catch {
        // Avatar sync failure should not break data sync state
      }
    } catch (err) {
      setLastError(err instanceof Error ? err.message : "Sync failed");
    } finally {
      syncInProgressRef.current = false;
      setIsSyncing(false);
    }
  }, [shouldSkip, userId]);

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
        // Refresh isOnline — navigator.onLine may have changed while suspended
        setIsOnline(navigator.onLine);
        runSync();
      }
    }

    document.addEventListener("visibilitychange", handleVisibility);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [runSync]);

  // pagehide: reset syncInProgress so sync is not permanently blocked
  // after iOS kills a mid-flight request during page suspension
  useEffect(() => {
    function handlePageHide() {
      syncInProgressRef.current = false;
    }

    window.addEventListener("pagehide", handlePageHide);
    return () => {
      window.removeEventListener("pagehide", handlePageHide);
    };
  }, []);

  // Initial sync on mount (if online + authenticated)
  useEffect(() => {
    runSync();
  }, [runSync]);

  // Derive sync state
  // Only show "syncing" when actively running. Pending items waiting for
  // backoff or next cycle should not keep the indicator spinning forever.
  let syncState: SyncState;
  if (shouldSkip) {
    syncState = "local-only";
  } else if (!isOnline) {
    syncState = "offline";
  } else if (isSyncing) {
    syncState = "syncing";
  } else if (failedCount > 0) {
    syncState = "error";
  } else {
    syncState = "synced";
  }

  return {
    syncState,
    failedCount,
    pendingCount,
    lastError,
    syncNow: runSync,
  };
}
