"use client";

import { useLiveQuery } from "dexie-react-hooks";
import { useTranslations } from "next-intl";
import { Film, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
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
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { db } from "@/lib/db";
import { GUEST_USER_ID } from "@/lib/guest";
import { FILM_FORMATS, FILM_PROCESSES } from "@/lib/constants";
import { FilmForm } from "./film-form";
import type { Film as FilmType, FilmStock, FilmFormat, FilmProcess } from "@/lib/types";
import { useState, useMemo } from "react";
import { toast } from "sonner";

export function FilmCatalog() {
  const t = useTranslations("gear");
  const tc = useTranslations("common");
  const [showAdd, setShowAdd] = useState(false);
  const [search, setSearch] = useState("");
  const [formatFilter, setFormatFilter] = useState<string>("all");
  const [processFilter, setProcessFilter] = useState<string>("all");

  const filmStocks = useLiveQuery(() => db.filmStock.toArray(), []);
  const customFilms = useLiveQuery(
    () =>
      db.films
        .where("user_id")
        .equals(GUEST_USER_ID)
        .filter((f) => f.deleted_at === null || f.deleted_at === undefined)
        .sortBy("created_at"),
    [],
  );

  const filteredStocks = useMemo(() => {
    if (!filmStocks) return [];
    return filmStocks.filter((stock) => {
      if (search) {
        const q = search.toLowerCase();
        if (
          !stock.name.toLowerCase().includes(q) &&
          !stock.brand.toLowerCase().includes(q)
        )
          return false;
      }
      if (formatFilter !== "all" && !stock.format.includes(formatFilter as FilmFormat))
        return false;
      if (processFilter !== "all" && stock.process !== processFilter)
        return false;
      return true;
    });
  }, [filmStocks, search, formatFilter, processFilter]);

  async function handleDeleteCustom(film: FilmType) {
    await db.films.update(film.id, {
      deleted_at: Date.now(),
      updated_at: Date.now(),
    });
    toast.success(t("filmDeleted"));
  }

  if (!filmStocks || !customFilms) return null;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">{t("films")}</h2>
        <Button size="sm" onClick={() => setShowAdd(true)}>
          <Plus className="mr-1 h-4 w-4" />
          {t("addFilm")}
        </Button>
      </div>

      {customFilms.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-medium text-muted-foreground">
            {t("customStocks")}
          </h3>
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
                <Badge variant="secondary" className="shrink-0">
                  {t("custom")}
                </Badge>
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

      <div className="space-y-2">
        <h3 className="text-sm font-medium text-muted-foreground">
          {t("catalog")} &middot;{" "}
          {t("stockCount", { count: filteredStocks.length })}
        </h3>

        <Input
          placeholder={tc("search")}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

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

        <div className="space-y-1">
          {filteredStocks.map((stock) => (
            <div
              key={stock.id}
              className="flex items-center gap-3 rounded-lg border border-border px-3 py-2"
            >
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">
                  {stock.brand} {stock.name}
                </p>
                <p className="text-xs text-muted-foreground">
                  ISO {stock.iso} &middot; {stock.format.join(", ")} &middot;{" "}
                  {stock.process}
                </p>
              </div>
            </div>
          ))}

          {filteredStocks.length === 0 && (
            <p className="py-4 text-center text-sm text-muted-foreground">
              {tc("noResults")}
            </p>
          )}
        </div>
      </div>

      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("addFilm")}</DialogTitle>
          </DialogHeader>
          <FilmForm onDone={() => setShowAdd(false)} />
        </DialogContent>
      </Dialog>
    </div>
  );
}
