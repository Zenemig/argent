"use client";

import { useLiveQuery } from "dexie-react-hooks";
import { useTranslations } from "next-intl";
import {
  Film,
  Plus,
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
import { FILM_FORMATS, FILM_PROCESSES } from "@/lib/constants";
import { FilmForm } from "./film-form";
import type { Film as FilmType, FilmStock, FilmFormat } from "@/lib/types";
import { useState, useMemo } from "react";
import { ulid } from "ulid";
import { toast } from "sonner";

export function FilmCatalog() {
  const t = useTranslations("gear");
  const tc = useTranslations("common");
  const userId = useUserId();
  const [showAdd, setShowAdd] = useState(false);
  const [catalogOpen, setCatalogOpen] = useState(false);
  const [formatFilter, setFormatFilter] = useState<string>("all");
  const [processFilter, setProcessFilter] = useState<string>("all");

  const filmStocks = useLiveQuery(() => db.filmStock.toArray(), []);
  const customFilms = useLiveQuery(
    () => {
      if (userId === undefined) return undefined as never;
      return db.films
        .where("user_id")
        .equals(userId!)
        .filter((f) => f.deleted_at === null || f.deleted_at === undefined)
        .sortBy("created_at");
    },
    [userId],
  );

  const filteredStocks = useMemo(() => {
    if (!filmStocks) return [];
    return filmStocks.filter((stock) => {
      if (formatFilter !== "all" && !stock.format.includes(formatFilter as FilmFormat))
        return false;
      if (processFilter !== "all" && stock.process !== processFilter)
        return false;
      return true;
    });
  }, [filmStocks, formatFilter, processFilter]);

  async function handleDeleteCustom(film: FilmType) {
    await syncUpdate("films", film.id, {
      deleted_at: Date.now(),
      updated_at: Date.now(),
    });
    toast.success(t("filmDeleted"));
  }

  async function handleAddFromCatalog(stock: FilmStock) {
    const now = Date.now();
    await syncAdd("films", {
      id: ulid(),
      user_id: userId!,
      brand: stock.brand,
      name: stock.name,
      iso: stock.iso,
      format: stock.format[0],
      process: stock.process,
      is_custom: false,
      deleted_at: null,
      updated_at: now,
      created_at: now,
    });
    toast.success(t("filmAdded"));
    setCatalogOpen(false);
  }

  if (!filmStocks || !customFilms || userId === undefined) {
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
                  <Skeleton className="h-3 w-32" />
                </div>
                <Skeleton className="h-5 w-14 rounded-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* User's films */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">{t("yourFilms")}</h2>
        <Button size="sm" variant="outline" onClick={() => setShowAdd(true)}>
          <Plus className="mr-1 h-4 w-4" />
          {t("addCustomFilm")}
        </Button>
      </div>

      {customFilms.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-8 text-center">
            <Film className="h-10 w-10 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">{t("emptyFilm")}</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2 lg:grid lg:grid-cols-2 lg:gap-4 lg:space-y-0">
          {customFilms.map((film) => (
            <Card key={film.id}>
              <CardContent className="flex items-center gap-3 py-3">
                <Film className="h-5 w-5 shrink-0 text-muted-foreground" />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">
                    {film.brand} {film.name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    ISO {film.iso} &middot; {film.format} &middot;{" "}
                    {film.process}
                  </p>
                </div>
                {film.is_custom && (
                  <Badge variant="secondary" className="shrink-0">
                    {t("custom")}
                  </Badge>
                )}
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
                        {t("deleteConfirm", {
                          name: `${film.brand} ${film.name}`,
                        })}
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>{tc("cancel")}</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => handleDeleteCustom(film)}
                      >
                        {tc("delete")}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Film catalog — filters then searchable dropdown */}
      <div className="space-y-2">
        <h3 className="text-sm font-medium text-muted-foreground">
          {t("filmCatalog")}
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

          <Select value={processFilter} onValueChange={setProcessFilter}>
            <SelectTrigger className="flex-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("allProcesses")}</SelectItem>
              {FILM_PROCESSES.map((p) => (
                <SelectItem key={p} value={p}>
                  {p}
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
                      value={`${stock.brand} ${stock.name}`}
                      onSelect={() => handleAddFromCatalog(stock)}
                    >
                      <div className="flex w-full items-center justify-between gap-2">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium">
                            {stock.brand} {stock.name}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            ISO {stock.iso} &middot; {stock.format.join(", ")}{" "}
                            &middot; {stock.process}
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

      {/* Add custom film dialog */}
      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("addCustomFilm")}</DialogTitle>
          </DialogHeader>
          <FilmForm onDone={() => setShowAdd(false)} />
        </DialogContent>
      </Dialog>
    </div>
  );
}
