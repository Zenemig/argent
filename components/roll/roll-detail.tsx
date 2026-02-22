"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useLiveQuery } from "dexie-react-hooks";
import Link from "next/link";
import { ArrowLeft, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { db } from "@/lib/db";
import { ShotLogger } from "./shot-logger";
import { RollLifecycle } from "./roll-lifecycle";
import { RollActionsMenu } from "./roll-actions-menu";
import {
  ExportDialog,
  type ExportFormat,
} from "@/components/export/xmp-export-dialog";
import { format } from "date-fns";

interface RollDetailProps {
  rollId: string;
}

export function RollDetail({ rollId }: RollDetailProps) {
  const t = useTranslations("roll");
  const tExport = useTranslations("export");

  const [exportFormat, setExportFormat] = useState<ExportFormat | null>(null);

  const roll = useLiveQuery(() => db.rolls.get(rollId), [rollId]);
  const camera = useLiveQuery(
    () => (roll ? db.cameras.get(roll.camera_id) : undefined),
    [roll?.camera_id],
  );
  const frameCount = useLiveQuery(
    () =>
      db.frames
        .where("roll_id")
        .equals(rollId)
        .filter((f) => f.deleted_at == null && !f.is_blank)
        .count(),
    [rollId],
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
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Skeleton className="h-9 w-9 rounded-md" />
          <div className="min-w-0 flex-1 space-y-1.5">
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-3 w-28" />
          </div>
          <Skeleton className="h-5 w-24 rounded-full" />
        </div>
        <div className="flex gap-1.5">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-7 w-20 rounded-full" />
          ))}
        </div>
        <Separator />
        <div className="space-y-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 rounded-lg border p-3">
              <Skeleton className="h-8 w-8 rounded" />
              <div className="min-w-0 flex-1 space-y-1.5">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-20" />
              </div>
              <Skeleton className="h-3 w-16" />
            </div>
          ))}
        </div>
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
        <RollActionsMenu roll={roll} frameCount={frameCount ?? 0} />

        <Badge variant="outline">
          {format(roll.start_date, "MMM d, yyyy")}
        </Badge>

        {(roll.status === "scanned" || roll.status === "archived") && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <Download className="mr-2 h-4 w-4" />
                {tExport("title")}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setExportFormat("xmp")}>
                {tExport("xmp")}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setExportFormat("csv")}>
                {tExport("csv")}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setExportFormat("script")}>
                {tExport("script")}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setExportFormat("json")}>
                {tExport("json")}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      <RollLifecycle roll={roll} />

      <Separator />

      <ShotLogger roll={roll} />

      {exportFormat && (
        <ExportDialog
          rollId={roll.id}
          frameCount={roll.frame_count}
          format={exportFormat}
          open={true}
          onOpenChange={(open) => {
            if (!open) setExportFormat(null);
          }}
        />
      )}
    </div>
  );
}
