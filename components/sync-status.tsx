"use client";

import { useTranslations } from "next-intl";
import { useSync } from "@/hooks/useSync";
import { useUserId } from "@/hooks/useUserId";
import { toast } from "sonner";

export function SyncStatus() {
  const t = useTranslations("sync");
  const userId = useUserId();
  const { syncState, failedCount, syncNow } = useSync(userId);

  // Guest users see nothing
  if (syncState === "local-only") return null;

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
  );
}
