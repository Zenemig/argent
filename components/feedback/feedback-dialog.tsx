"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { FEEDBACK_CATEGORIES } from "@/lib/constants";
import type { FeedbackCategory } from "@/lib/constants";

interface FeedbackDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const CATEGORY_KEYS: Record<FeedbackCategory, string> = {
  bug: "categoryBug",
  feature: "categoryFeature",
  general: "categoryGeneral",
};

export function FeedbackDialog({ open, onOpenChange }: FeedbackDialogProps) {
  const t = useTranslations("feedback");
  const [category, setCategory] = useState<FeedbackCategory | "">("");
  const [description, setDescription] = useState("");
  const [includeEmail, setIncludeEmail] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit() {
    setSubmitting(true);
    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category: category || "general",
          description,
          includeEmail,
          metadata: {
            page: window.location.pathname,
            userAgent: navigator.userAgent,
          },
        }),
      });

      if (res.status === 429) {
        toast.error(t("rateLimited"));
        return;
      }

      if (!res.ok) {
        toast.error(t("error"));
        return;
      }

      toast.success(t("success"));
      // Reset form
      setCategory("");
      setDescription("");
      setIncludeEmail(false);
      onOpenChange(false);
    } catch {
      toast.error(t("error"));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t("title")}</DialogTitle>
          <DialogDescription>{t("description")}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>{t("category")}</Label>
            <Select
              value={category}
              onValueChange={(v) => setCategory(v as FeedbackCategory)}
            >
              <SelectTrigger aria-label={t("category")}>
                <SelectValue placeholder={t("categoryPlaceholder")} />
              </SelectTrigger>
              <SelectContent>
                {FEEDBACK_CATEGORIES.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {t(CATEGORY_KEYS[cat])}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>{t("message")}</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={t("messagePlaceholder")}
              rows={4}
            />
          </div>

          <div className="flex items-center gap-2">
            <Checkbox
              id="include-email"
              checked={includeEmail}
              onCheckedChange={(checked) =>
                setIncludeEmail(checked === true)
              }
            />
            <Label htmlFor="include-email" className="text-sm font-normal">
              {t("includeEmail")}
            </Label>
          </div>

          <Button
            onClick={handleSubmit}
            disabled={submitting}
            className="w-full"
          >
            {submitting ? t("sending") : t("submit")}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
