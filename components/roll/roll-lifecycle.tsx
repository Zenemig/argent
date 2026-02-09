"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Undo2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { db } from "@/lib/db";
import type { Roll, RollStatus } from "@/lib/types";
import {
  STATUS_ORDER,
  getNextStatus,
  getPrevStatus,
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

  const nextStatus = getNextStatus(roll.status);
  const prevStatus = getPrevStatus(roll.status);

  async function advanceStatus() {
    if (!nextStatus) return;

    // If advancing to "developed", show the lab dialog
    if (nextStatus === "developed") {
      setShowDevelopDialog(true);
      return;
    }

    const now = Date.now();
    const updates: Partial<Roll> = {
      status: nextStatus,
      updated_at: now,
    };

    if (nextStatus === "finished") updates.finish_date = now;
    if (nextStatus === "scanned") updates.scan_date = now;

    await db.rolls.update(roll.id, updates);
    toast.success(t("statusUpdated"));
  }

  async function confirmDeveloped() {
    const now = Date.now();
    await db.rolls.update(roll.id, {
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
    const now = Date.now();
    const updates: Partial<Roll> = {
      status: prevStatus,
      updated_at: now,
    };

    // Clear the date for the status we're undoing
    if (roll.status === "finished") updates.finish_date = null;
    if (roll.status === "developed") {
      updates.develop_date = null;
      updates.lab_name = null;
      updates.dev_notes = null;
    }
    if (roll.status === "scanned") updates.scan_date = null;

    await db.rolls.update(roll.id, updates);
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
      <div className="flex gap-2">
        {nextStatus && ACTION_KEYS[nextStatus] && (
          <Button onClick={advanceStatus} className="flex-1">
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
