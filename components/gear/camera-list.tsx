"use client";

import { useLiveQuery } from "dexie-react-hooks";
import { useTranslations } from "next-intl";
import { Camera as CameraIcon, Plus, Pencil, Trash2 } from "lucide-react";
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
import { CameraForm } from "./camera-form";
import type { Camera } from "@/lib/types";
import { useState } from "react";
import { toast } from "sonner";

export function CameraList() {
  const t = useTranslations("gear");
  const tc = useTranslations("common");
  const [showAdd, setShowAdd] = useState(false);
  const [editCamera, setEditCamera] = useState<Camera | null>(null);

  const cameras = useLiveQuery(
    () =>
      db.cameras
        .where("user_id")
        .equals(GUEST_USER_ID)
        .filter((c) => c.deleted_at === null || c.deleted_at === undefined)
        .sortBy("created_at"),
    [],
  );

  async function handleDelete(camera: Camera) {
    await db.cameras.update(camera.id, {
      deleted_at: Date.now(),
      updated_at: Date.now(),
    });
    toast.success(t("cameraDeleted"));
  }

  if (!cameras) return null;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">{t("cameras")}</h2>
        <Button size="sm" onClick={() => setShowAdd(true)}>
          <Plus className="mr-1 h-4 w-4" />
          {t("addCamera")}
        </Button>
      </div>

      {cameras.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-8 text-center">
            <CameraIcon className="h-10 w-10 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">{t("emptyCamera")}</p>
            <Button size="sm" onClick={() => setShowAdd(true)}>
              <Plus className="mr-1 h-4 w-4" />
              {t("addCamera")}
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {cameras.map((camera) => (
            <Card key={camera.id}>
              <CardContent className="flex items-center gap-3 py-3">
                <CameraIcon className="h-5 w-5 shrink-0 text-muted-foreground" />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{camera.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {camera.make}
                  </p>
                </div>
                <Badge variant="secondary" className="shrink-0">
                  {camera.format}
                </Badge>
                <div className="flex shrink-0 gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => setEditCamera(camera)}
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
                          {t("deleteConfirm", { name: camera.name })}
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>{tc("cancel")}</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleDelete(camera)}
                        >
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
            <DialogTitle>{t("addCamera")}</DialogTitle>
          </DialogHeader>
          <CameraForm onDone={() => setShowAdd(false)} />
        </DialogContent>
      </Dialog>

      <Dialog open={!!editCamera} onOpenChange={() => setEditCamera(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{tc("edit")}</DialogTitle>
          </DialogHeader>
          {editCamera && (
            <CameraForm
              camera={editCamera}
              onDone={() => setEditCamera(null)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
