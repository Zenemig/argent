"use client";

import { useTranslations } from "next-intl";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ROLL_STATUSES } from "@/lib/constants";
import type { Camera } from "@/lib/types";

interface FilmOption {
  id: string;
  label: string;
}

interface DashboardFiltersProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  statusFilter: string;
  onStatusFilterChange: (value: string) => void;
  cameraFilter: string;
  onCameraFilterChange: (value: string) => void;
  filmFilter: string;
  onFilmFilterChange: (value: string) => void;
  sortBy: string;
  onSortByChange: (value: string) => void;
  cameras: Camera[];
  films: FilmOption[];
}

export function DashboardFilters({
  searchQuery,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  cameraFilter,
  onCameraFilterChange,
  filmFilter,
  onFilmFilterChange,
  sortBy,
  onSortByChange,
  cameras,
  films,
}: DashboardFiltersProps) {
  const t = useTranslations("roll");
  const tc = useTranslations("common");

  return (
    <div className="space-y-2 lg:flex lg:items-end lg:gap-3 lg:space-y-0">
      <div className="relative lg:w-64">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder={tc("search")}
          className="pl-9"
          aria-label={tc("search")}
        />
      </div>

      <div className="grid grid-cols-2 gap-2 lg:flex lg:flex-1 lg:gap-3">
        <Select value={statusFilter} onValueChange={onStatusFilterChange}>
          <SelectTrigger aria-label={t("all")}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("all")}</SelectItem>
            {ROLL_STATUSES.map((s) => (
              <SelectItem key={s} value={s}>
                {t(`status.${s}`)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={sortBy} onValueChange={onSortByChange}>
          <SelectTrigger aria-label={t("sortDate")}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="date">{t("sortDate")}</SelectItem>
            <SelectItem value="status">{t("sortStatus")}</SelectItem>
            <SelectItem value="camera">{t("sortCamera")}</SelectItem>
          </SelectContent>
        </Select>

        {cameras.length > 0 && (
          <Select value={cameraFilter} onValueChange={onCameraFilterChange}>
            <SelectTrigger aria-label={t("allCameras")}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("allCameras")}</SelectItem>
              {cameras.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        {films.length > 0 && (
          <Select value={filmFilter} onValueChange={onFilmFilterChange}>
            <SelectTrigger aria-label={t("allFilms")}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("allFilms")}</SelectItem>
              {films.map((f) => (
                <SelectItem key={f.id} value={f.id}>
                  {f.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>
    </div>
  );
}
