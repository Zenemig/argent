"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useSync } from "@/hooks/useSync";
import { useUserId } from "@/hooks/useUserId";
import { useUserTier } from "@/hooks/useUserTier";
import { LiveRegion } from "@/components/live-region";
import { SyncDetailsSheet } from "@/components/sync-details-sheet";
import { toast } from "sonner";

export function SyncStatus() {
  const t = useTranslations("sync");
  const tUpgrade = useTranslations("upgrade");
  const userId = useUserId();
  const { isProUser, isAuthenticated } = useUserTier();
  const { syncState, failedCount, pendingCount, lastError, syncNow } = useSync(
    userId ?? null,
    { enabled: isProUser },
  );
  const [sheetOpen, setSheetOpen] = useState(false);

  // Unauthenticated users see nothing (shouldn't happen behind route protection)
  if (!isAuthenticated) return null;

  // Free users: show muted "Local only" label
  if (!isProUser) {
    return (
      <button
        type="button"
        onClick={() => toast.info(tUpgrade("syncTeaser"))}
        className="flex items-center gap-1.5 rounded-full px-1.5 py-0.5 text-xs text-muted-foreground transition-colors hover:text-foreground"
        aria-label={t("localOnly")}
      >
        <span className="relative flex h-2 w-2">
          <span className="relative inline-flex h-2 w-2 rounded-full bg-zinc-500" />
        </span>
        <span>{t("localOnly")}</span>
      </button>
    );
  }

  const colors: Record<string, string> = {
    synced: "bg-green-500",
    syncing: "bg-yellow-500",
    offline: "bg-zinc-500",
    error: "bg-red-500",
  };

  const labels: Record<string, string> = {
    synced: t("synced"),
    syncing: t("syncing"),
    offline: t("offline"),
    error: t("error"),
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setSheetOpen(true)}
        className="flex items-center gap-1.5 rounded-full px-1.5 py-0.5 text-xs text-muted-foreground transition-colors hover:text-foreground"
        aria-label={labels[syncState] ?? ""}
      >
        <span className="relative flex h-2 w-2">
          {syncState === "syncing" && (
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-yellow-400 opacity-75" />
          )}
          <span
            className={`relative inline-flex h-2 w-2 rounded-full ${colors[syncState] ?? "bg-zinc-500"}`}
          />
        </span>
      </button>
      <LiveRegion>{labels[syncState]}</LiveRegion>
      <SyncDetailsSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        syncState={syncState}
        pendingCount={pendingCount}
        failedCount={failedCount}
        lastError={lastError}
        syncNow={syncNow}
        isProUser={isProUser}
      />
    </>
  );
}
