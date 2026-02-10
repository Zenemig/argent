"use client";

import { useTransition } from "react";
import { useTranslations } from "next-intl";
import { Cloud, Monitor, Image } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { joinWaitlist } from "@/app/(app)/settings/actions";
import { toast } from "sonner";

export function UpgradePrompt() {
  const t = useTranslations("upgrade");
  const [pending, startTransition] = useTransition();

  function handleJoin() {
    startTransition(async () => {
      const result = await joinWaitlist();
      if (result.success) {
        toast.success(t("waitlistConfirmed"));
      }
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{t("title")}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">{t("description")}</p>
        <ul className="space-y-2 text-sm">
          <li className="flex items-center gap-2">
            <Cloud className="h-4 w-4 text-muted-foreground" />
            {t("featureSync")}
          </li>
          <li className="flex items-center gap-2">
            <Monitor className="h-4 w-4 text-muted-foreground" />
            {t("featureMultiDevice")}
          </li>
          <li className="flex items-center gap-2">
            <Image className="h-4 w-4 text-muted-foreground" />
            {t("featureBackup")}
          </li>
        </ul>
        <Button variant="outline" size="sm" disabled={pending} onClick={handleJoin}>
          {t("cta")}
        </Button>
      </CardContent>
    </Card>
  );
}
