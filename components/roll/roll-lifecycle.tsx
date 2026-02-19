"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useTranslations } from "next-intl";
import { Undo2, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { syncUpdate } from "@/lib/sync-write";
import { cn } from "@/lib/utils";
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

  // Scroll affordance state (all hooks must be above early returns)
  const scrollRef = useRef<HTMLDivElement>(null);
  const activeRef = useRef<HTMLDivElement>(null);
  const [fadeLeft, setFadeLeft] = useState(false);
  const [fadeRight, setFadeRight] = useState(false);

  const updateFades = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    setFadeLeft(el.scrollLeft > 4);
    setFadeRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 4);
  }, []);

  useEffect(() => {
    updateFades();
    const el = scrollRef.current;
    if (!el) return;
    el.addEventListener("scroll", updateFades, { passive: true });
    const ro = new ResizeObserver(updateFades);
    ro.observe(el);
    return () => {
      el.removeEventListener("scroll", updateFades);
      ro.disconnect();
    };
  }, [updateFades]);

  useEffect(() => {
    const el = activeRef.current;
    if (!el) return;
    const prefersReduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    el.scrollIntoView({
      behavior: prefersReduced ? "instant" : "smooth",
      block: "nearest",
      inline: "center",
    });
  }, [roll.status]);

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
  const currentIdx = STATUS_ORDER.indexOf(roll.status);

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

  return (
    <div className="space-y-4">
      {/* Status timeline */}
      <div className="relative">
        <div
          aria-hidden="true"
          className={cn(
            "pointer-events-none absolute inset-y-0 left-0 z-10 w-8 transition-opacity duration-200",
            fadeLeft ? "opacity-100" : "opacity-0",
          )}
          style={{
            background:
              "linear-gradient(to right, var(--background), transparent)",
          }}
        />
        <div
          aria-hidden="true"
          className={cn(
            "pointer-events-none absolute inset-y-0 right-0 z-10 w-8 transition-opacity duration-200",
            fadeRight ? "opacity-100" : "opacity-0",
          )}
          style={{
            background:
              "linear-gradient(to left, var(--background), transparent)",
          }}
        />
        <div
          ref={scrollRef}
          data-testid="status-timeline"
          className="flex items-center gap-1 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {STATUS_ORDER.map((s, i) => {
            const isPast = i < currentIdx;
            const isCurrent = i === currentIdx;
            return (
              <div
                key={s}
                ref={isCurrent ? activeRef : undefined}
                data-testid={isCurrent ? "status-pill-active" : undefined}
                className="flex items-center gap-1"
              >
                {i > 0 && (
                  <div
                    className={cn(
                      "h-px w-3",
                      isPast || isCurrent ? "bg-primary" : "bg-border",
                    )}
                  />
                )}
                <div
                  className={cn(
                    "whitespace-nowrap rounded-full px-2 py-0.5 text-xs",
                    isCurrent
                      ? "bg-primary text-primary-foreground"
                      : isPast
                        ? "bg-primary/20 text-primary"
                        : "bg-muted text-muted-foreground",
                  )}
                >
                  {t(`status.${s}`)}
                </div>
              </div>
            );
          })}
        </div>
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
            <DialogDescription className="sr-only">
              {t("actions.develop")}
            </DialogDescription>
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
