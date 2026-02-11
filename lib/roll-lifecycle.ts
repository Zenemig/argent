import type { RollStatus } from "./types";
import type { Roll } from "./types";

export const STATUS_ORDER: RollStatus[] = [
  "loaded",
  "active",
  "finished",
  "developed",
  "scanned",
  "archived",
];

export function getNextStatus(current: RollStatus): RollStatus | null {
  const idx = STATUS_ORDER.indexOf(current);
  if (idx === -1 || idx >= STATUS_ORDER.length - 1) return null;
  return STATUS_ORDER[idx + 1];
}

export function getPrevStatus(current: RollStatus): RollStatus | null {
  const idx = STATUS_ORDER.indexOf(current);
  if (idx <= 0) return null;
  return STATUS_ORDER[idx - 1];
}

export const ACTION_KEYS: Record<string, string> = {
  finished: "finish",
  developed: "develop",
  scanned: "scan",
  archived: "archive",
};

export const STATUS_COLORS: Record<string, string> = {
  loaded: "bg-blue-500/20 text-blue-400",
  active: "bg-green-500/20 text-green-400",
  finished: "bg-yellow-500/20 text-yellow-400",
  developed: "bg-purple-500/20 text-purple-400",
  scanned: "bg-cyan-500/20 text-cyan-400",
  archived: "bg-muted text-muted-foreground",
  discarded: "bg-destructive/20 text-destructive",
};

/**
 * Returns the partial update fields when advancing to `nextStatus`.
 * Always includes `status` and `updated_at`.
 */
export function getAdvanceFields(nextStatus: RollStatus): Partial<Roll> {
  const now = Date.now();
  const updates: Partial<Roll> = {
    status: nextStatus,
    updated_at: now,
  };

  if (nextStatus === "finished") updates.finish_date = now;
  if (nextStatus === "developed") updates.develop_date = now;
  if (nextStatus === "scanned") updates.scan_date = now;

  return updates;
}

/**
 * Returns the partial update fields when undoing from `currentStatus` to `prevStatus`.
 * Clears the date field for the current status being undone.
 */
export function getUndoFields(
  currentStatus: RollStatus,
  prevStatus: RollStatus,
): Partial<Roll> {
  const updates: Partial<Roll> = {
    status: prevStatus,
    updated_at: Date.now(),
  };

  if (currentStatus === "finished") updates.finish_date = null;
  if (currentStatus === "developed") {
    updates.develop_date = null;
    updates.lab_name = null;
    updates.dev_notes = null;
  }
  if (currentStatus === "scanned") updates.scan_date = null;

  return updates;
}
