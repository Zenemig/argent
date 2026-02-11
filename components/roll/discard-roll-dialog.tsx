"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { syncUpdate } from "@/lib/sync-write";
import { toast } from "sonner";

const DISCARD_REASONS = [
  "lost_stolen",
  "light_leak",
  "damaged",
  "lab_error",
  "other",
] as const;

interface DiscardRollDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  rollId: string;
}

export function DiscardRollDialog({
  open,
  onOpenChange,
  rollId,
}: DiscardRollDialogProps) {
  const t = useTranslations("roll");
  const tc = useTranslations("common");

  const [reason, setReason] = useState<string>(DISCARD_REASONS[0]);
  const [notes, setNotes] = useState("");

  async function handleConfirm() {
    await syncUpdate("rolls", rollId, {
      status: "discarded",
      discard_reason: reason,
      discard_notes: notes.trim() || null,
      updated_at: Date.now(),
    });
    onOpenChange(false);
    toast.success(t("rollDiscarded"));
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("discardRoll")}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-3">
            <Label>{t("discardReasonLabel")}</Label>
            <RadioGroup value={reason} onValueChange={setReason}>
              {DISCARD_REASONS.map((r) => (
                <div key={r} className="flex items-center space-x-2">
                  <RadioGroupItem value={r} id={`reason-${r}`} />
                  <Label htmlFor={`reason-${r}`} className="font-normal">
                    {t(`discardReason.${r}`)}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>
          <div className="space-y-2">
            <Label htmlFor="discard-notes">{t("discardNotesLabel")}</Label>
            <Textarea
              id="discard-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
            />
          </div>
          <div className="flex gap-2">
            <Button
              variant="destructive"
              onClick={handleConfirm}
              className="flex-1"
            >
              {t("discardRoll")}
            </Button>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              {tc("cancel")}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
