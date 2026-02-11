"use client";

import { useState, useMemo } from "react";
import { useTranslations } from "next-intl";
import { useLiveQuery } from "dexie-react-hooks";
import { Plus, Film } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { db } from "@/lib/db";
import { useUserId } from "@/hooks/useUserId";
import { filterAndSortRolls, buildFilmMap } from "@/lib/filter-rolls";
import { RollCard } from "./roll-card";
import { DashboardFilters } from "./dashboard-filters";
import { LoadRollWizard } from "./load-roll-wizard";

export function DashboardContent() {
  const t = useTranslations("roll");
  const userId = useUserId();
  const [showWizard, setShowWizard] = useState(false);

  // Filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [cameraFilter, setCameraFilter] = useState("all");
  const [filmFilter, setFilmFilter] = useState("all");
  const [sortBy, setSortBy] = useState("date");

  // Data queries
  // Return undefined (as never for TS) when userId is still loading so
  // useLiveQuery never produces a stale [] from querying with equals("").
  const rolls = useLiveQuery(
    () => {
      if (userId === undefined) return undefined as never;
      return db.rolls
        .where("user_id")
        .equals(userId!)
        .filter((r) => r.deleted_at === null || r.deleted_at === undefined)
        .toArray();
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

  const customFilms = useLiveQuery(
    () => {
      if (userId === undefined) return undefined as never;
      return db.films
        .where("user_id")
        .equals(userId!)
        .filter((f) => f.deleted_at === null || f.deleted_at === undefined)
        .toArray();
    },
    [userId],
  );

  const seedFilms = useLiveQuery(() => db.filmStock.toArray(), []);

  // Build film lookup and options
  const filmMap = useMemo(
    () => buildFilmMap(customFilms ?? [], seedFilms ?? []),
    [customFilms, seedFilms],
  );

  const filmOptions = useMemo(() => {
    if (!rolls) return [];
    const usedIds = new Set(rolls.map((r) => r.film_id));
    return Array.from(usedIds)
      .map((id) => {
        const f = filmMap.get(id);
        return f ? { id, label: `${f.brand} ${f.name}` } : null;
      })
      .filter((f): f is { id: string; label: string } => f !== null)
      .sort((a, b) => a.label.localeCompare(b.label));
  }, [rolls, filmMap]);

  // Filter and sort
  const filteredRolls = useMemo(() => {
    if (!rolls || !cameras) return [];
    return filterAndSortRolls(rolls, cameras, filmMap, {
      searchQuery,
      statusFilter,
      cameraFilter,
      filmFilter,
      sortBy: sortBy as "date" | "status" | "camera",
    });
  }, [rolls, cameras, filmMap, searchQuery, statusFilter, cameraFilter, filmFilter, sortBy]);

  if (!rolls || userId === undefined) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Skeleton className="h-7 w-40" />
          <Skeleton className="h-8 w-28" />
        </div>
        <div className="space-y-2 lg:grid lg:grid-cols-2 lg:gap-4 lg:space-y-0 xl:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="space-y-3 py-3">
                <div className="flex items-center gap-3">
                  <Skeleton className="h-5 w-5 shrink-0 rounded-full" />
                  <div className="min-w-0 flex-1 space-y-1.5">
                    <Skeleton className="h-4 w-36" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                  <Skeleton className="h-5 w-16 rounded-full" />
                </div>
                <Skeleton className="h-2 w-full rounded-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  const hasRolls = rolls.length > 0;
  const hasResults = filteredRolls.length > 0;
  const hasActiveFilters =
    searchQuery || statusFilter !== "all" || cameraFilter !== "all" || filmFilter !== "all";

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{t("allRolls")}</h1>
        <Button size="sm" onClick={() => setShowWizard(true)}>
          <Plus className="mr-1 h-4 w-4" />
          {t("loadNew")}
        </Button>
      </div>

      {hasRolls && (
        <DashboardFilters
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          statusFilter={statusFilter}
          onStatusFilterChange={setStatusFilter}
          cameraFilter={cameraFilter}
          onCameraFilterChange={setCameraFilter}
          filmFilter={filmFilter}
          onFilmFilterChange={setFilmFilter}
          sortBy={sortBy}
          onSortByChange={setSortBy}
          cameras={cameras ?? []}
          films={filmOptions}
        />
      )}

      {!hasRolls ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
            <Film className="h-12 w-12 text-muted-foreground" />
            <div>
              <p className="font-medium">{t("noRolls")}</p>
              <p className="text-sm text-muted-foreground">
                {t("noRollsHint")}
              </p>
            </div>
            <Button onClick={() => setShowWizard(true)}>
              <Plus className="mr-1 h-4 w-4" />
              {t("loadNew")}
            </Button>
          </CardContent>
        </Card>
      ) : hasResults ? (
        <div className="space-y-2 lg:grid lg:grid-cols-2 lg:gap-4 lg:space-y-0 xl:grid-cols-3">
          {filteredRolls.map((roll) => (
            <RollCard key={roll.id} roll={roll} />
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-8 text-center">
            <p className="text-sm text-muted-foreground">
              {hasActiveFilters ? t("noFilterResults") : t("noRolls")}
            </p>
          </CardContent>
        </Card>
      )}

      <LoadRollWizard open={showWizard} onOpenChange={setShowWizard} />
    </div>
  );
}
