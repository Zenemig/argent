"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/lib/db";
import {
  retryFailedEntries,
  clearFailedEntries,
  getFailedEntrySummary,
} from "@/lib/sync-engine";
import { useStoragePersisted } from "@/components/db-provider";
import type { SyncState } from "@/hooks/useSync";
import type { SyncableTable } from "@/lib/constants";
import type { SyncConflict } from "@/lib/types";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";

interface SyncDetailsSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  syncState: SyncState;
  pendingCount: number;
  failedCount: number;
  lastError: string | null;
  syncNow: () => Promise<void>;
  isProUser: boolean;
}

const STATE_COLORS: Record<string, string> = {
  synced: "bg-green-500",
  syncing: "bg-yellow-500",
  offline: "bg-zinc-500",
  error: "bg-red-500",
  "local-only": "bg-zinc-500",
};

export function SyncDetailsSheet({
  open,
  onOpenChange,
  syncState,
  pendingCount,
  failedCount,
  lastError,
  syncNow,
  isProUser,
}: SyncDetailsSheetProps) {
  const t = useTranslations("sync");
  const tUpgrade = useTranslations("upgrade");
  const isPersisted = useStoragePersisted();
  const [confirmDiscard, setConfirmDiscard] = useState(false);
  const [failedSummary, setFailedSummary] = useState<
    Map<SyncableTable, { count: number; entities: { id: string; operation: string }[] }>
  >(new Map());

  const conflicts = useLiveQuery(
    () =>
      db._syncConflicts
        .orderBy("id")
        .reverse()
        .limit(10)
        .toArray(),
    [],
  ) as SyncConflict[] | undefined;

  const lastUploadMeta = useLiveQuery(
    () => db._syncMeta.get("lastUploadSync"),
    [],
  );
  const lastDownloadMeta = useLiveQuery(
    () => db._syncMeta.get("lastDownloadSync"),
    [],
  );

  // Show the most recent of upload/download timestamps
  const lastSyncValue = (() => {
    const up = lastUploadMeta?.value;
    const down = lastDownloadMeta?.value;
    if (up && down) return up > down ? up : down;
    return up || down || null;
  })();

  useEffect(() => {
    if (open && failedCount > 0) {
      getFailedEntrySummary().then(setFailedSummary);
    }
  }, [open, failedCount]);

  async function handleRetry() {
    await retryFailedEntries();
    await syncNow();
  }

  async function handleDiscard() {
    if (!confirmDiscard) {
      setConfirmDiscard(true);
      return;
    }
    await clearFailedEntries();
    setConfirmDiscard(false);
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              {syncState === "syncing" && (
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-yellow-400 opacity-75" />
              )}
              <span
                className={`relative inline-flex h-2 w-2 rounded-full ${STATE_COLORS[syncState] ?? "bg-zinc-500"}`}
              />
            </span>
            {t("details.title")}
          </SheetTitle>
          <SheetDescription>
            {t(syncState === "local-only" ? "localOnly" : syncState)}
          </SheetDescription>
        </SheetHeader>

        {!isProUser ? (
          <div className="px-4 py-6 text-center text-sm text-muted-foreground">
            <p>{tUpgrade("syncTeaser")}</p>
          </div>
        ) : (
          <div className="flex flex-col gap-4 px-4 pb-4">
            {/* Stats row */}
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-lg border p-3 text-center">
                <p className="text-2xl font-semibold">{pendingCount}</p>
                <p className="text-xs text-muted-foreground">
                  {t("details.pending")}
                </p>
              </div>
              <div className="rounded-lg border p-3 text-center">
                <p className="text-2xl font-semibold">{failedCount}</p>
                <p className="text-xs text-muted-foreground">
                  {t("details.failed")}
                </p>
              </div>
            </div>

            {/* Last synced */}
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">
                {t("details.lastSynced")}
              </span>
              <span>
                {lastSyncValue
                  ? new Date(lastSyncValue).toLocaleString()
                  : t("details.never")}
              </span>
            </div>

            {/* Storage persistence */}
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">
                {t("details.storage")}
              </span>
              <span>
                {isPersisted === true
                  ? t("details.storageGranted")
                  : isPersisted === false
                    ? t("details.storageNotGranted")
                    : t("details.storageUnknown")}
              </span>
            </div>

            {/* Last error */}
            {lastError && (
              <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-400">
                {lastError}
              </div>
            )}

            {/* Actions */}
            <div className="flex flex-col gap-2">
              <button
                type="button"
                onClick={() => syncNow()}
                disabled={syncState === "syncing"}
                className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
                aria-label={t("details.syncNow")}
              >
                {t("details.syncNow")}
              </button>

              {failedCount > 0 && (
                <>
                  <button
                    type="button"
                    onClick={handleRetry}
                    className="rounded-lg border px-4 py-2 text-sm font-medium transition-colors hover:bg-accent"
                    aria-label={t("details.retryFailed")}
                  >
                    {t("details.retryFailed")}
                  </button>
                  <button
                    type="button"
                    onClick={handleDiscard}
                    className="rounded-lg border border-red-500/30 px-4 py-2 text-sm font-medium text-red-400 transition-colors hover:bg-red-500/10"
                    aria-label={t("details.discardFailed")}
                  >
                    {confirmDiscard
                      ? t("details.discardConfirm")
                      : t("details.discardFailed")}
                  </button>
                </>
              )}
            </div>

            {/* Failed items */}
            {failedCount > 0 && failedSummary.size > 0 && (
              <details>
                <summary className="cursor-pointer text-sm font-medium">
                  {t("details.failedItems")}
                </summary>
                <div className="mt-2 flex flex-col gap-1">
                  {Array.from(failedSummary.entries()).map(
                    ([table, { count }]) => (
                      <div
                        key={table}
                        className="flex items-center justify-between rounded border px-3 py-1.5 text-sm"
                      >
                        <span>{t(`table.${table}`)}</span>
                        <span className="text-muted-foreground">{count}</span>
                      </div>
                    ),
                  )}
                </div>
              </details>
            )}

            {/* Recent conflicts */}
            <details>
              <summary className="cursor-pointer text-sm font-medium">
                {t("details.conflicts")}
              </summary>
              <div className="mt-2 flex flex-col gap-1">
                {conflicts && conflicts.length > 0 ? (
                  conflicts.map((c) => (
                    <div
                      key={c.id}
                      className="flex items-center justify-between rounded border px-3 py-1.5 text-xs"
                    >
                      <span>
                        {t(`table.${c.table as "cameras" | "lenses" | "films" | "rolls" | "frames"}`)}
                        {" · "}
                        {c.entity_id.slice(0, 8)}…
                      </span>
                      <span className="text-muted-foreground">
                        {t("details.conflictResolved")}
                      </span>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">
                    {t("details.noConflicts")}
                  </p>
                )}
              </div>
            </details>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
