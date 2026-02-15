"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";
import { db } from "@/lib/db";
import { toast } from "sonner";

export function DeleteAccountSection() {
  const t = useTranslations("settings");
  const router = useRouter();
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [confirmationText, setConfirmationText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUserEmail(user?.email ?? null);
    });
  }, []);

  const isConfirmed = confirmationText === userEmail;

  async function handleDelete() {
    if (!isConfirmed || !userEmail) return;

    setIsDeleting(true);

    try {
      const res = await fetch("/api/account/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ confirmation: confirmationText }),
      });

      if (!res.ok) {
        toast.error(t("deleteAccountError"));
        setIsDeleting(false);
        return;
      }

      // Clear local data
      await db.delete();
      localStorage.clear();

      // Redirect to login
      router.push("/login");
    } catch {
      toast.error(t("deleteAccountError"));
      setIsDeleting(false);
    }
  }

  return (
    <div className="mt-3">
      <p className="text-sm text-muted-foreground">
        {t("deleteAccountDescription")}
      </p>

      <AlertDialog open={dialogOpen} onOpenChange={(open) => {
        setDialogOpen(open);
        if (!open) {
          setConfirmationText("");
          setIsDeleting(false);
        }
      }}>
        <AlertDialogTrigger asChild>
          <Button variant="destructive" className="mt-3">
            {t("deleteAccountButton")}
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("deleteAccountConfirmTitle")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("deleteAccountConfirmDescription")}
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="space-y-2">
            <Label htmlFor="delete-confirm">{t("deleteAccountConfirmLabel")}</Label>
            <Input
              id="delete-confirm"
              value={confirmationText}
              onChange={(e) => setConfirmationText(e.target.value)}
              placeholder={t("deleteAccountConfirmPlaceholder")}
              autoComplete="off"
            />
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel>{t("cancel")}</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              disabled={!isConfirmed || isDeleting}
              onClick={handleDelete}
            >
              {isDeleting ? t("deleteAccountConfirming") : t("deleteAccount")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
