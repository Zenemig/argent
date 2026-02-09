"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useLiveQuery } from "dexie-react-hooks";
import { Plus, Film } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { db } from "@/lib/db";
import { GUEST_USER_ID } from "@/lib/guest";
import { ROLL_STATUSES } from "@/lib/constants";
import { RollCard } from "./roll-card";
import { LoadRollWizard } from "./load-roll-wizard";
import type { RollStatus } from "@/lib/types";

export function DashboardContent() {
  const t = useTranslations("roll");
  const [showWizard, setShowWizard] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const rolls = useLiveQuery(
    () =>
      db.rolls
        .where("user_id")
        .equals(GUEST_USER_ID)
        .filter((r) => {
          if (r.deleted_at !== null && r.deleted_at !== undefined) return false;
          if (statusFilter !== "all" && r.status !== statusFilter) return false;
          return true;
        })
        .reverse()
        .sortBy("created_at"),
    [statusFilter],
  );

  if (!rolls) return null;

  const hasRolls = rolls.length > 0;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{t("allRolls")}</h1>
        <Button size="sm" onClick={() => setShowWizard(true)}>
          <Plus className="mr-1 h-4 w-4" />
          {t("loadNew")}
        </Button>
      </div>

      {hasRolls && (
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("all")}</SelectItem>
            {ROLL_STATUSES.map((s) => (
              <SelectItem key={s} value={s}>
                {t(`status.${s}`)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      {!hasRolls ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
            <Film className="h-12 w-12 text-muted-foreground" />
            <div>
              <p className="font-medium">{t("noRolls")}</p>
              <p className="text-sm text-muted-foreground">
                {t("noRollsHint")}
              </p>
            </div>
            <Button onClick={() => setShowWizard(true)}>
              <Plus className="mr-1 h-4 w-4" />
              {t("loadNew")}
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {rolls.map((roll) => (
            <RollCard key={roll.id} roll={roll} />
          ))}
        </div>
      )}

      <LoadRollWizard open={showWizard} onOpenChange={setShowWizard} />
    </div>
  );
}
