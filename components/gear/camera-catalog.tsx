"use client";

import { useLiveQuery } from "dexie-react-hooks";
import { useTranslations } from "next-intl";
import {
  Camera as CameraIcon,
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
import { FILM_FORMATS, LENS_MOUNTS, CAMERA_TYPES, formatLabel } from "@/lib/constants";
import { CameraForm } from "./camera-form";
import type { Camera } from "@/lib/types";
import { useState, useMemo } from "react";
import { toast } from "sonner";

export function CameraCatalog() {
  const t = useTranslations("gear");
  const tc = useTranslations("common");
  const userId = useUserId();
  const [showAdd, setShowAdd] = useState(false);
  const [editCamera, setEditCamera] = useState<Camera | null>(null);
  const [formatFilter, setFormatFilter] = useState<string>("all");
  const [mountFilter, setMountFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");

  const cameras = useLiveQuery(
    () => {
      if (userId === undefined) return undefined as never;
      return db.cameras
        .where("user_id")
        .equals(userId!)
        .filter((c) => c.deleted_at === null || c.deleted_at === undefined)
        .sortBy("created_at");
    },
    [userId],
  );

  const filteredCameras = useMemo(() => {
    if (!cameras) return [];
    return cameras.filter((cam) => {
      if (formatFilter !== "all" && cam.format !== formatFilter) return false;
      if (mountFilter !== "all" && cam.mount !== mountFilter) return false;
      if (typeFilter !== "all" && cam.type !== typeFilter) return false;
      return true;
    });
  }, [cameras, formatFilter, mountFilter, typeFilter]);

  async function handleDelete(camera: Camera) {
    await syncUpdate("cameras", camera.id, {
      deleted_at: Date.now(),
      updated_at: Date.now(),
    });
    toast.success(t("cameraDeleted"));
  }

  if (!cameras || userId === undefined) {
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
                  <Skeleton className="h-3 w-20" />
                </div>
                <Skeleton className="h-5 w-12 rounded-full" />
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
        <h2 className="text-lg font-semibold">{t("yourCameras")}</h2>
        <Button size="sm" variant="outline" onClick={() => setShowAdd(true)}>
          <Plus className="mr-1 h-4 w-4" />
          {t("addCamera")}
        </Button>
      </div>

      {/* Filters */}
      <div className="flex gap-2">
        <Select value={formatFilter} onValueChange={setFormatFilter}>
          <SelectTrigger className="flex-1">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("allFormats")}</SelectItem>
            {FILM_FORMATS.map((f) => (
              <SelectItem key={f} value={f}>
                {formatLabel(f)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

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

        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="flex-1">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("allTypes")}</SelectItem>
            {CAMERA_TYPES.map((ct) => (
              <SelectItem key={ct} value={ct}>
                {formatLabel(ct)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {filteredCameras.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-8 text-center">
            <CameraIcon className="h-10 w-10 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">{t("emptyCamera")}</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2 lg:grid lg:grid-cols-2 lg:gap-4 lg:space-y-0">
          {filteredCameras.map((camera) => (
            <Card key={camera.id}>
              <CardContent className="flex items-center gap-3 py-3">
                <CameraIcon className="h-5 w-5 shrink-0 text-muted-foreground" />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{camera.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {camera.make}
                    {camera.mount && <> &middot; {camera.mount}</>}
                    {camera.type && <> &middot; {formatLabel(camera.type)}</>}
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

      {/* Add camera dialog */}
      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("addCamera")}</DialogTitle>
            <DialogDescription className="sr-only">
              {t("addCamera")}
            </DialogDescription>
          </DialogHeader>
          <CameraForm onDone={() => setShowAdd(false)} />
        </DialogContent>
      </Dialog>

      {/* Edit camera dialog */}
      <Dialog open={!!editCamera} onOpenChange={() => setEditCamera(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{tc("edit")}</DialogTitle>
            <DialogDescription className="sr-only">
              {tc("edit")}
            </DialogDescription>
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
