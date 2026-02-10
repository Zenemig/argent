"use client";

import { useLiveQuery } from "dexie-react-hooks";
import { useTranslations } from "next-intl";
import {
  Focus,
  Plus,
  Pencil,
  Trash2,
  ChevronsUpDown,
  Search,
} from "lucide-react";
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
import { GUEST_USER_ID } from "@/lib/guest";
import { LENS_MOUNTS } from "@/lib/constants";
import { LensForm } from "./lens-form";
import type { Lens, Camera, LensStock } from "@/lib/types";
import { useState, useMemo } from "react";
import { ulid } from "ulid";
import { toast } from "sonner";

export function LensCatalog() {
  const t = useTranslations("gear");
  const tc = useTranslations("common");
  const [showAdd, setShowAdd] = useState(false);
  const [editLens, setEditLens] = useState<Lens | null>(null);
  const [catalogOpen, setCatalogOpen] = useState(false);
  const [mountFilter, setMountFilter] = useState<string>("all");

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

  const lensStocks = useLiveQuery(() => db.lensStock.toArray(), []);

  const filteredStocks = useMemo(() => {
    if (!lensStocks) return [];
    return lensStocks.filter((stock) => {
      if (mountFilter !== "all" && stock.mount !== mountFilter) return false;
      return true;
    });
  }, [lensStocks, mountFilter]);

  async function handleDelete(lens: Lens) {
    await db.lenses.update(lens.id, {
      deleted_at: Date.now(),
      updated_at: Date.now(),
    });
    toast.success(t("lensDeleted"));
  }

  async function handleAddFromCatalog(stock: LensStock) {
    const now = Date.now();
    await db.lenses.add({
      id: ulid(),
      user_id: GUEST_USER_ID,
      name: `${stock.make} ${stock.name}`,
      make: stock.make,
      focal_length: stock.focal_length,
      max_aperture: stock.max_aperture,
      camera_id: null,
      deleted_at: null,
      updated_at: now,
      created_at: now,
    });
    toast.success(t("lensAdded"));
    setCatalogOpen(false);
  }

  function getCameraName(cameraId: string | null | undefined): string {
    if (!cameraId || !cameras) return t("universal");
    const cam = cameras.find((c: Camera) => c.id === cameraId);
    return cam ? cam.name : t("universal");
  }

  if (!lenses || !cameras || !lensStocks) return null;

  return (
    <div className="space-y-4">
      {/* User's lenses */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">{t("yourLenses")}</h2>
        <Button size="sm" variant="outline" onClick={() => setShowAdd(true)}>
          <Plus className="mr-1 h-4 w-4" />
          {t("addCustomLens")}
        </Button>
      </div>

      {lenses.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-8 text-center">
            <Focus className="h-10 w-10 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">{t("emptyLens")}</p>
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

      {/* Lens catalog — filter then searchable dropdown */}
      <div className="space-y-2">
        <h3 className="text-sm font-medium text-muted-foreground">
          {t("lensCatalog")}
        </h3>

        <div className="flex gap-2">
          <Select value={mountFilter} onValueChange={setMountFilter}>
            <SelectTrigger className="w-full">
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
                            {stock.focal_length}mm f/{stock.max_aperture}{" "}
                            &middot; {stock.mount}
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

      {/* Add custom lens dialog */}
      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("addCustomLens")}</DialogTitle>
          </DialogHeader>
          <LensForm cameras={cameras} onDone={() => setShowAdd(false)} />
        </DialogContent>
      </Dialog>

      {/* Edit lens dialog */}
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
