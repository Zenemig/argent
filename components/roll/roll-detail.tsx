"use client";

import { useTranslations } from "next-intl";
import { useLiveQuery } from "dexie-react-hooks";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { db } from "@/lib/db";
import { ShotLogger } from "./shot-logger";
import { RollLifecycle } from "./roll-lifecycle";
import { format } from "date-fns";

interface RollDetailProps {
  rollId: string;
}

export function RollDetail({ rollId }: RollDetailProps) {
  const t = useTranslations("roll");

  const roll = useLiveQuery(() => db.rolls.get(rollId), [rollId]);
  const camera = useLiveQuery(
    () => (roll ? db.cameras.get(roll.camera_id) : undefined),
    [roll?.camera_id],
  );
  const film = useLiveQuery(async () => {
    if (!roll) return undefined;
    const custom = await db.films.get(roll.film_id);
    if (custom) return { brand: custom.brand, name: custom.name };
    const stock = await db.filmStock.get(roll.film_id);
    if (stock) return { brand: stock.brand, name: stock.name };
    return undefined;
  }, [roll?.film_id]);

  if (!roll) {
    return (
      <div className="py-12 text-center text-muted-foreground">
        {t("title")}...
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-lg font-bold">
            {film ? `${film.brand} ${film.name}` : t("title")}
          </h1>
          <p className="text-xs text-muted-foreground">
            {camera?.name ?? ""}
            {roll.ei !== 0 && ` · EI ${roll.ei}`}
            {roll.push_pull !== 0 &&
              ` (${roll.push_pull > 0 ? "+" : ""}${roll.push_pull})`}
          </p>
        </div>
        <Badge variant="outline">
          {format(roll.start_date, "MMM d, yyyy")}
        </Badge>
      </div>

      <RollLifecycle roll={roll} />

      <Separator />

      <ShotLogger roll={roll} />
    </div>
  );
}
