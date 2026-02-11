"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Undo2, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { syncUpdate } from "@/lib/sync-write";
import type { Roll, RollStatus } from "@/lib/types";
import {
  STATUS_ORDER,
  getNextStatus,
  getPrevStatus,
  getAdvanceFields,
  getUndoFields,
  ACTION_KEYS,
} from "@/lib/roll-lifecycle";
import { toast } from "sonner";

interface RollLifecycleProps {
  roll: Roll;
}

export function RollLifecycle({ roll }: RollLifecycleProps) {
  const t = useTranslations("roll");
  const tc = useTranslations("common");

  const [showDevelopDialog, setShowDevelopDialog] = useState(false);
  const [labName, setLabName] = useState(roll.lab_name ?? "");
  const [devNotes, setDevNotes] = useState(roll.dev_notes ?? "");

  // Discarded rolls show a banner instead of the lifecycle timeline
  if (roll.status === "discarded") {
    return (
      <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4">
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 shrink-0 text-destructive" />
          <div>
            <p className="font-medium text-destructive">
              {t("status.discarded")}
            </p>
            {roll.discard_reason && (
              <p className="text-sm text-muted-foreground">
                {t(`discardReason.${roll.discard_reason}`)}
              </p>
            )}
            {roll.discard_notes && (
              <p className="mt-1 text-sm text-muted-foreground">
                {roll.discard_notes}
              </p>
            )}
          </div>
        </div>
      </div>
    );
  }

  const nextStatus = getNextStatus(roll.status);
  const prevStatus = getPrevStatus(roll.status);

  async function advanceStatus() {
    if (!nextStatus) return;

    // If advancing to "developed", show the lab dialog
    if (nextStatus === "developed") {
      setShowDevelopDialog(true);
      return;
    }

    await syncUpdate("rolls", roll.id, getAdvanceFields(nextStatus));
    toast.success(t("statusUpdated"));
  }

  async function confirmDeveloped() {
    const now = Date.now();
    await syncUpdate("rolls", roll.id, {
      status: "developed" as RollStatus,
      develop_date: now,
      lab_name: labName.trim() || null,
      dev_notes: devNotes.trim() || null,
      updated_at: now,
    });
    setShowDevelopDialog(false);
    toast.success(t("statusUpdated"));
  }

  async function undoStatus() {
    if (!prevStatus) return;
    await syncUpdate("rolls", roll.id, getUndoFields(roll.status, prevStatus));
    toast.success(t("statusUpdated"));
  }

  // Status timeline
  const currentIdx = STATUS_ORDER.indexOf(roll.status);

  return (
    <div className="space-y-4">
      {/* Status timeline */}
      <div className="flex items-center gap-1 overflow-x-auto">
        {STATUS_ORDER.map((s, i) => {
          const isPast = i < currentIdx;
          const isCurrent = i === currentIdx;
          return (
            <div key={s} className="flex items-center gap-1">
              {i > 0 && (
                <div
                  className={`h-px w-3 ${
                    isPast || isCurrent ? "bg-primary" : "bg-border"
                  }`}
                />
              )}
              <div
                className={`whitespace-nowrap rounded-full px-2 py-0.5 text-xs ${
                  isCurrent
                    ? "bg-primary text-primary-foreground"
                    : isPast
                      ? "bg-primary/20 text-primary"
                      : "bg-muted text-muted-foreground"
                }`}
              >
                {t(`status.${s}`)}
              </div>
            </div>
          );
        })}
      </div>

      {/* Action buttons */}
      <div className="flex gap-2 lg:w-fit">
        {nextStatus && ACTION_KEYS[nextStatus] && (
          <Button onClick={advanceStatus} className="flex-1 lg:flex-initial lg:px-8">
            {t(`actions.${ACTION_KEYS[nextStatus]}`)}
          </Button>
        )}
        {prevStatus && (
          <Button variant="outline" size="icon" onClick={undoStatus} aria-label={t("undoStatus")}>
            <Undo2 className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Develop dialog */}
      <Dialog open={showDevelopDialog} onOpenChange={setShowDevelopDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("actions.develop")}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="lab-name">{t("labName")}</Label>
              <Input
                id="lab-name"
                value={labName}
                onChange={(e) => setLabName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="dev-notes">{t("devNotes")}</Label>
              <Input
                id="dev-notes"
                value={devNotes}
                onChange={(e) => setDevNotes(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              <Button onClick={confirmDeveloped} className="flex-1">
                {tc("confirm")}
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowDevelopDialog(false)}
              >
                {tc("cancel")}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
