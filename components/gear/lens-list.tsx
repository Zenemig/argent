"use client";

import { useLiveQuery } from "dexie-react-hooks";
import { useTranslations } from "next-intl";
import { Focus, Plus, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { db } from "@/lib/db";
import { GUEST_USER_ID } from "@/lib/guest";
import { LensForm } from "./lens-form";
import type { Lens, Camera } from "@/lib/types";
import { useState } from "react";
import { toast } from "sonner";

export function LensList() {
  const t = useTranslations("gear");
  const tc = useTranslations("common");
  const [showAdd, setShowAdd] = useState(false);
  const [editLens, setEditLens] = useState<Lens | null>(null);

  const lenses = useLiveQuery(
    () =>
      db.lenses
        .where("user_id")
        .equals(GUEST_USER_ID)
        .filter((l) => l.deleted_at === null || l.deleted_at === undefined)
        .sortBy("created_at"),
    [],
  );

  const cameras = useLiveQuery(
    () =>
      db.cameras
        .where("user_id")
        .equals(GUEST_USER_ID)
        .filter((c) => c.deleted_at === null || c.deleted_at === undefined)
        .toArray(),
    [],
  );

  async function handleDelete(lens: Lens) {
    await db.lenses.update(lens.id, {
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

  if (!lenses || !cameras) return null;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">{t("lenses")}</h2>
        <Button size="sm" onClick={() => setShowAdd(true)}>
          <Plus className="mr-1 h-4 w-4" />
          {t("addLens")}
        </Button>
      </div>

      {lenses.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-8 text-center">
            <Focus className="h-10 w-10 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">{t("emptyLens")}</p>
            <Button size="sm" onClick={() => setShowAdd(true)}>
              <Plus className="mr-1 h-4 w-4" />
              {t("addLens")}
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {lenses.map((lens) => (
            <Card key={lens.id}>
              <CardContent className="flex items-center gap-3 py-3">
                <Focus className="h-5 w-5 shrink-0 text-muted-foreground" />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{lens.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {lens.make} &middot; {lens.focal_length}mm f/
                    {lens.max_aperture}
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

      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("addLens")}</DialogTitle>
          </DialogHeader>
          <LensForm cameras={cameras} onDone={() => setShowAdd(false)} />
        </DialogContent>
      </Dialog>

      <Dialog open={!!editLens} onOpenChange={() => setEditLens(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{tc("edit")}</DialogTitle>
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
