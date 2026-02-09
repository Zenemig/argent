"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { Film, ChevronRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/lib/db";
import type { Roll } from "@/lib/types";
import { format } from "date-fns";

const STATUS_COLORS: Record<string, string> = {
  loaded: "bg-blue-500/20 text-blue-400",
  active: "bg-green-500/20 text-green-400",
  finished: "bg-yellow-500/20 text-yellow-400",
  developed: "bg-purple-500/20 text-purple-400",
  scanned: "bg-cyan-500/20 text-cyan-400",
  archived: "bg-muted text-muted-foreground",
};

export function RollCard({ roll }: { roll: Roll }) {
  const t = useTranslations("roll");

  const camera = useLiveQuery(
    () => db.cameras.get(roll.camera_id),
    [roll.camera_id],
  );

  const film = useLiveQuery(async () => {
    const custom = await db.films.get(roll.film_id);
    if (custom) return { brand: custom.brand, name: custom.name };
    const stock = await db.filmStock.get(roll.film_id);
    if (stock) return { brand: stock.brand, name: stock.name };
    return null;
  }, [roll.film_id]);

  const frameCount = useLiveQuery(
    () => db.frames.where("roll_id").equals(roll.id).count(),
    [roll.id],
  );

  return (
    <Link href={`/roll/${roll.id}`}>
      <Card className="transition-colors hover:bg-accent/50">
        <CardContent className="flex items-center gap-3 py-3">
          <Film className="h-5 w-5 shrink-0 text-muted-foreground" />
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <p className="truncate font-medium">
                {film ? `${film.brand} ${film.name}` : "..."}
              </p>
            </div>
            <p className="text-xs text-muted-foreground">
              {camera?.name ?? "..."} &middot;{" "}
              {t("progress", {
                current: frameCount ?? 0,
                total: roll.frame_count,
              })}
            </p>
            {roll.ei !== 0 && roll.push_pull !== 0 && (
              <p className="text-xs text-muted-foreground">
                EI {roll.ei}
                {roll.push_pull > 0
                  ? ` (+${roll.push_pull})`
                  : roll.push_pull < 0
                    ? ` (${roll.push_pull})`
                    : ""}
              </p>
            )}
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <Badge
              variant="secondary"
              className={STATUS_COLORS[roll.status] || ""}
            >
              {t(`status.${roll.status}`)}
            </Badge>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
