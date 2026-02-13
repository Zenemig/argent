"use client";

import { useTranslations } from "next-intl";
import { useSync } from "@/hooks/useSync";
import { useUserId } from "@/hooks/useUserId";
import { useUserTier } from "@/hooks/useUserTier";
import { LiveRegion } from "@/components/live-region";
import { toast } from "sonner";

export function SyncStatus() {
  const t = useTranslations("sync");
  const tUpgrade = useTranslations("upgrade");
  const userId = useUserId();
  const { isProUser, isAuthenticated } = useUserTier();
  const { syncState, failedCount, syncNow } = useSync(userId ?? null, {
    enabled: isProUser,
  });

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

  // Pro users: existing colored-dot indicator
  function handleClick() {
    if (syncState === "error") {
      toast.error(
        t("error") + (failedCount > 0 ? ` (${failedCount})` : ""),
      );
    } else if (syncState === "offline") {
      toast.info(t("offline"));
    } else {
      syncNow();
    }
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
        onClick={handleClick}
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
    </>
  );
}
