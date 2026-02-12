"use client";

import { useLiveQuery } from "dexie-react-hooks";
import { useTranslations } from "next-intl";
import {
  Focus,
  Plus,
  Pencil,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { db } from "@/lib/db";
import { syncUpdate } from "@/lib/sync-write";
import { useUserId } from "@/hooks/useUserId";
import { LENS_MOUNTS, formatLabel } from "@/lib/constants";
import { LensForm } from "./lens-form";
import { formatLensSpec } from "@/lib/lens-utils";
import type { Lens, Camera } from "@/lib/types";
import { useState, useMemo } from "react";
import { toast } from "sonner";

export function LensCatalog() {
  const t = useTranslations("gear");
  const tc = useTranslations("common");
  const userId = useUserId();
  const [showAdd, setShowAdd] = useState(false);
  const [editLens, setEditLens] = useState<Lens | null>(null);
  const [mountFilter, setMountFilter] = useState<string>("all");
  const [cameraFilter, setCameraFilter] = useState<string>("all");

  const lenses = useLiveQuery(
    () => {
      if (userId === undefined) return undefined as never;
      return db.lenses
        .where("user_id")
        .equals(userId!)
        .filter((l) => l.deleted_at === null || l.deleted_at === undefined)
        .sortBy("created_at");
    },
    [userId],
  );

  const cameras = useLiveQuery(
    () => {
      if (userId === undefined) return undefined as never;
      return db.cameras
        .where("user_id")
        .equals(userId!)
        .filter((c) => c.deleted_at === null || c.deleted_at === undefined)
        .toArray();
    },
    [userId],
  );

  const filteredLenses = useMemo(() => {
    if (!lenses) return [];
    return lenses.filter((lens) => {
      if (mountFilter !== "all" && lens.mount !== mountFilter) return false;
      if (cameraFilter !== "all") {
        if (cameraFilter === "__none__") {
          if (lens.camera_id != null) return false;
        } else {
          if (lens.camera_id !== cameraFilter) return false;
        }
      }
      return true;
    });
  }, [lenses, mountFilter, cameraFilter]);

  async function handleDelete(lens: Lens) {
    await syncUpdate("lenses", lens.id, {
      deleted_at: Date.now(),
      updated_at: Date.now(),
    });
    toast.success(t("lensDeleted"));
  }

  function getCameraName(cameraId: string | null | undefined): string {
    if (!cameraId || !cameras) return t("universal");
    const cam = cameras.find((c: Camera) => c.id === cameraId);
    return cam ? cam.name : t("universal");
  }

  if (!lenses || !cameras || userId === undefined) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Skeleton className="h-6 w-36" />
          <Skeleton className="h-8 w-40" />
        </div>
        <div className="space-y-2 lg:grid lg:grid-cols-2 lg:gap-4 lg:space-y-0">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="flex items-center gap-3 py-3">
                <Skeleton className="h-5 w-5 shrink-0 rounded" />
                <div className="min-w-0 flex-1 space-y-1.5">
                  <Skeleton className="h-4 w-36" />
                  <Skeleton className="h-3 w-28" />
                </div>
                <Skeleton className="h-5 w-16 rounded-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">{t("yourLenses")}</h2>
        <Button size="sm" variant="outline" onClick={() => setShowAdd(true)}>
          <Plus className="mr-1 h-4 w-4" />
          {t("addLens")}
        </Button>
      </div>

      {/* Filters */}
      <div className="flex gap-2">
        <Select value={mountFilter} onValueChange={setMountFilter}>
          <SelectTrigger className="flex-1">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("allMounts")}</SelectItem>
            {LENS_MOUNTS.map((m) => (
              <SelectItem key={m} value={m}>
                {formatLabel(m)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={cameraFilter} onValueChange={setCameraFilter}>
          <SelectTrigger className="flex-1">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("allCameras")}</SelectItem>
            <SelectItem value="__none__">{t("universal")}</SelectItem>
            {cameras.map((cam) => (
              <SelectItem key={cam.id} value={cam.id}>
                {cam.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {filteredLenses.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-8 text-center">
            <Focus className="h-10 w-10 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">{t("emptyLens")}</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2 lg:grid lg:grid-cols-2 lg:gap-4 lg:space-y-0">
          {filteredLenses.map((lens) => (
            <Card key={lens.id}>
              <CardContent className="flex items-center gap-3 py-3">
                <Focus className="h-5 w-5 shrink-0 text-muted-foreground" />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{lens.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {lens.make} &middot; {formatLensSpec(lens)}
                    {lens.mount && <> &middot; {lens.mount}</>}
                  </p>
                </div>
                <Badge variant="outline" className="shrink-0 text-xs">
                  {getCameraName(lens.camera_id)}
                </Badge>
                <div className="flex shrink-0 gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => setEditLens(lens)}
                    aria-label={tc("edit")}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive"
                        aria-label={tc("delete")}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>{tc("confirm")}</AlertDialogTitle>
                        <AlertDialogDescription>
                          {t("deleteConfirm", { name: lens.name })}
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>{tc("cancel")}</AlertDialogCancel>
                        <AlertDialogAction onClick={() => handleDelete(lens)}>
                          {tc("delete")}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Add lens dialog */}
      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("addLens")}</DialogTitle>
            <DialogDescription className="sr-only">
              {t("addLens")}
            </DialogDescription>
          </DialogHeader>
          <LensForm cameras={cameras} onDone={() => setShowAdd(false)} />
        </DialogContent>
      </Dialog>

      {/* Edit lens dialog */}
      <Dialog open={!!editLens} onOpenChange={() => setEditLens(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{tc("edit")}</DialogTitle>
            <DialogDescription className="sr-only">
              {tc("edit")}
            </DialogDescription>
          </DialogHeader>
          {editLens && (
            <LensForm
              lens={editLens}
              cameras={cameras}
              onDone={() => setEditLens(null)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
