"use client";

import { useEffect, useState, useRef } from "react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { ShieldAlert, Download, Bookmark, Sparkles, X } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useStoragePersisted } from "@/components/db-provider";
import { useUserTier } from "@/hooks/useUserTier";

const DISMISS_KEY = "pwa-install-banner-dismissed";
const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
}

function isDismissedRecently(): boolean {
  const dismissed = localStorage.getItem(DISMISS_KEY);
  if (!dismissed) return false;
  const elapsed = Date.now() - Number(dismissed);
  return elapsed < SEVEN_DAYS_MS;
}

function shouldShow(isPersisted: boolean | null, isProUser: boolean): boolean {
  return isPersisted === false && !isProUser && !isDismissedRecently();
}

export function PwaInstallBanner() {
  const t = useTranslations("pwaInstall");
  const isPersisted = useStoragePersisted();
  const { isProUser } = useUserTier();
  const [visible, setVisible] = useState(false);
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const promptRef = useRef<BeforeInstallPromptEvent | null>(null);

  // Re-evaluate visibility whenever isPersisted or isProUser changes.
  // This handles the race where tier loads async and initially reads as "free".
  useEffect(() => {
    if (shouldShow(isPersisted, isProUser)) {
      setVisible(true);
    } else {
      setVisible(false);
    }
  }, [isPersisted, isProUser]);

  useEffect(() => {
    function handleBeforeInstall(e: Event) {
      e.preventDefault();
      const promptEvent = e as BeforeInstallPromptEvent;
      promptRef.current = promptEvent;
      setInstallPrompt(promptEvent);
    }

    function handleAppInstalled() {
      setVisible(false);
      promptRef.current = null;
      setInstallPrompt(null);
    }

    window.addEventListener("beforeinstallprompt", handleBeforeInstall);
    window.addEventListener("appinstalled", handleAppInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstall);
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  function handleDismiss() {
    localStorage.setItem(DISMISS_KEY, String(Date.now()));
    setVisible(false);
  }

  function handleInstall() {
    promptRef.current?.prompt();
  }

  if (!visible) return null;

  return (
    <Card className="mb-4 border-amber-500/30 bg-amber-500/5">
      <CardHeader className="flex flex-row items-start justify-between pb-2">
        <CardTitle className="flex items-center gap-2 text-sm font-medium">
          <ShieldAlert className="h-4 w-4 text-amber-500" />
          {t("title")}
        </CardTitle>
        <Button
          variant="ghost"
          size="icon"
          className="-mr-2 -mt-2 h-7 w-7 text-muted-foreground"
          onClick={handleDismiss}
          aria-label={t("dismiss")}
        >
          <X className="h-3.5 w-3.5" />
        </Button>
      </CardHeader>
      <CardContent className="space-y-3 pt-0">
        <p className="text-sm text-muted-foreground">{t("description")}</p>
        <ul className="space-y-1.5 text-sm">
          {installPrompt && (
            <li className="flex items-center gap-2">
              <Download className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
              <button
                onClick={handleInstall}
                className="underline underline-offset-2 hover:text-foreground"
                aria-label={t("installAction")}
              >
                {t("installAction")}
              </button>
            </li>
          )}
          <li className="flex items-center gap-2 text-muted-foreground">
            <Bookmark className="h-3.5 w-3.5 shrink-0" />
            {t("bookmarkTip")}
          </li>
          <li className="flex items-center gap-2 text-muted-foreground">
            <Sparkles className="h-3.5 w-3.5 shrink-0" />
            <span>
              {t("upgradeTip")}{" "}
              <Link href="/settings" className="underline underline-offset-2 hover:text-foreground">
                {t("upgradeLink")}
              </Link>
            </span>
          </li>
        </ul>
      </CardContent>
    </Card>
  );
}
