"use client";

import { useLiveQuery } from "dexie-react-hooks";
import { useTranslations } from "next-intl";
import {
  Camera as CameraIcon,
  Plus,
  Pencil,
  Trash2,
  ChevronsUpDown,
  Search,
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
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
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
import { syncAdd, syncUpdate } from "@/lib/sync-write";
import { useUserId } from "@/hooks/useUserId";
import { FILM_FORMATS, LENS_MOUNTS, CAMERA_TYPES } from "@/lib/constants";
import { CameraForm } from "./camera-form";
import type { Camera, CameraStock } from "@/lib/types";
import { useState, useMemo } from "react";
import { ulid } from "ulid";
import { toast } from "sonner";

export function CameraCatalog() {
  const t = useTranslations("gear");
  const tc = useTranslations("common");
  const userId = useUserId();
  const [showAdd, setShowAdd] = useState(false);
  const [editCamera, setEditCamera] = useState<Camera | null>(null);
  const [catalogOpen, setCatalogOpen] = useState(false);
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

  const cameraStocks = useLiveQuery(() => db.cameraStock.toArray(), []);

  const filteredStocks = useMemo(() => {
    if (!cameraStocks) return [];
    return cameraStocks.filter((stock) => {
      if (formatFilter !== "all" && stock.format !== formatFilter) return false;
      if (mountFilter !== "all" && stock.mount !== mountFilter) return false;
      if (typeFilter !== "all" && stock.type !== typeFilter) return false;
      return true;
    });
  }, [cameraStocks, formatFilter, mountFilter, typeFilter]);

  async function handleDelete(camera: Camera) {
    await syncUpdate("cameras", camera.id, {
      deleted_at: Date.now(),
      updated_at: Date.now(),
    });
    toast.success(t("cameraDeleted"));
  }

  async function handleAddFromCatalog(stock: CameraStock) {
    const now = Date.now();
    await syncAdd("cameras", {
      id: ulid(),
      user_id: userId!,
      name: `${stock.make} ${stock.name}`,
      make: stock.make,
      format: stock.format,
      default_frame_count: stock.default_frame_count,
      notes: null,
      deleted_at: null,
      updated_at: now,
      created_at: now,
    });
    toast.success(t("cameraAdded"));
    setCatalogOpen(false);
  }

  if (!cameras || !cameraStocks || userId === undefined) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Skeleton className="h-6 w-36" />
          <Skeleton className="h-8 w-40" />
        </div>
        <div className="space-y-2">
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
      {/* User's cameras */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">{t("yourCameras")}</h2>
        <Button size="sm" variant="outline" onClick={() => setShowAdd(true)}>
          <Plus className="mr-1 h-4 w-4" />
          {t("addCustomCamera")}
        </Button>
      </div>

      {cameras.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-8 text-center">
            <CameraIcon className="h-10 w-10 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">{t("emptyCamera")}</p>
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

      {/* Camera catalog — filters then searchable dropdown */}
      <div className="space-y-2">
        <h3 className="text-sm font-medium text-muted-foreground">
          {t("cameraCatalog")}
        </h3>

        <div className="flex gap-2">
          <Select value={formatFilter} onValueChange={setFormatFilter}>
            <SelectTrigger className="flex-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("allFormats")}</SelectItem>
              {FILM_FORMATS.map((f) => (
                <SelectItem key={f} value={f}>
                  {f}
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
                  {m}
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
                  {ct}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Popover open={catalogOpen} onOpenChange={setCatalogOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={catalogOpen}
              className="w-full justify-between"
            >
              <span className="flex items-center gap-2 text-muted-foreground">
                <Search className="h-4 w-4" />
                {t("addFromCatalog")}
              </span>
              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
            <Command filter={(value, search) => {
              if (!search) return 1;
              return value.toLowerCase().includes(search.toLowerCase()) ? 1 : 0;
            }}>
              <CommandInput placeholder={tc("search")} />
              <CommandList>
                <CommandEmpty>{tc("noResults")}</CommandEmpty>
                <CommandGroup>
                  {filteredStocks.map((stock) => (
                    <CommandItem
                      key={stock.id}
                      value={`${stock.make} ${stock.name}`}
                      onSelect={() => handleAddFromCatalog(stock)}
                    >
                      <div className="flex w-full items-center justify-between gap-2">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium">
                            {stock.make} {stock.name}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {stock.format} &middot; {stock.mount} &middot;{" "}
                            {stock.type}
                          </p>
                        </div>
                        <Plus className="h-4 w-4 shrink-0 text-muted-foreground" />
                      </div>
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      </div>

      {/* Add custom camera dialog */}
      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("addCustomCamera")}</DialogTitle>
          </DialogHeader>
          <CameraForm onDone={() => setShowAdd(false)} />
        </DialogContent>
      </Dialog>

      {/* Edit camera dialog */}
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
