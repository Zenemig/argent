"use client";

import {
  useState,
  useEffect,
  useRef,
  useCallback,
  type ComponentType,
} from "react";
import { useTranslations, useLocale } from "next-intl";
import { Loader2, MapPin, Search, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { LocationMapProps } from "./location-map";

const DEFAULT_LAT = 51.505;
const DEFAULT_LON = -0.09;
const SEARCH_DEBOUNCE_MS = 500;

interface NominatimResult {
  place_id: number;
  display_name: string;
  lat: string;
  lon: string;
}

export interface LocationPickerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialLat?: number | null;
  initialLon?: number | null;
  initialName?: string | null;
  onConfirm: (lat: number, lon: number, name: string) => void;
  onClear?: () => void;
}

export function LocationPickerDialog({
  open,
  onOpenChange,
  initialLat,
  initialLon,
  initialName,
  onConfirm,
  onClear,
}: LocationPickerDialogProps) {
  const t = useTranslations("frame");
  const locale = useLocale();

  const [lat, setLat] = useState<number>(initialLat ?? DEFAULT_LAT);
  const [lon, setLon] = useState<number>(initialLon ?? DEFAULT_LON);
  const [name, setName] = useState<string>(initialName ?? "");

  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<NominatimResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isOffline, setIsOffline] = useState(false);

  const [MapComponent, setMapComponent] =
    useState<ComponentType<LocationMapProps> | null>(null);
  const [isMapLoading, setIsMapLoading] = useState(false);
  const [mapError, setMapError] = useState(false);

  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Preload location-map module when dialog opens
  useEffect(() => {
    if (!open) return;
    setIsMapLoading(true);
    void import("./location-map").then((mod) => {
      setMapComponent(() => mod.default);
      setIsMapLoading(false);
    });
  }, [open]);

  // Reset coords/name from props each time the dialog opens
  useEffect(() => {
    if (!open) return;
    setLat(initialLat ?? DEFAULT_LAT);
    setLon(initialLon ?? DEFAULT_LON);
    setName(initialName ?? "");
    setSearchQuery("");
    setSearchResults([]);
    setMapError(false);
  }, [open, initialLat, initialLon, initialName]);

  // Cancel pending search on dialog close
  useEffect(() => {
    if (open) return;
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    if (abortControllerRef.current) abortControllerRef.current.abort();
  }, [open]);

  // Offline detection
  useEffect(() => {
    if (!open) return;
    setIsOffline(!navigator.onLine);
    const onOnline = () => setIsOffline(false);
    const onOffline = () => setIsOffline(true);
    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);
    return () => {
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
    };
  }, [open]);

  // Nominatim search with debounce
  const handleSearchChange = useCallback(
    (query: string) => {
      setSearchQuery(query);
      if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
      if (abortControllerRef.current) abortControllerRef.current.abort();
      if (!query.trim() || isOffline) {
        setSearchResults([]);
        return;
      }
      searchTimeoutRef.current = setTimeout(async () => {
        const controller = new AbortController();
        abortControllerRef.current = controller;
        setIsSearching(true);
        try {
          const url = new URL("https://nominatim.openstreetmap.org/search");
          url.searchParams.set("format", "json");
          url.searchParams.set("limit", "5");
          url.searchParams.set("q", query.trim());
          const res = await fetch(url.toString(), {
            headers: { "Accept-Language": locale },
            signal: controller.signal,
          });
          const data: NominatimResult[] = await res.json();
          setSearchResults(data);
        } catch (err) {
          if ((err as Error).name !== "AbortError") setSearchResults([]);
        } finally {
          setIsSearching(false);
        }
      }, SEARCH_DEBOUNCE_MS);
    },
    [isOffline, locale],
  );

  function handleResultSelect(result: NominatimResult) {
    const newLat = parseFloat(result.lat);
    const newLon = parseFloat(result.lon);
    setLat(newLat);
    setLon(newLon);
    setName(result.display_name);
    setSearchQuery(result.display_name);
    setSearchResults([]);
  }

  function handleMarkerMove(newLat: number, newLon: number) {
    setLat(newLat);
    setLon(newLon);
  }

  function handleConfirm() {
    onConfirm(lat, lon, name);
  }

  const hasExistingLocation = initialLat != null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[90vh] w-full max-w-lg flex-col gap-0 overflow-hidden p-0">
        <DialogHeader className="shrink-0 px-6 pt-6 pb-4">
          <DialogTitle className="flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            {t("location.title")}
          </DialogTitle>
          <DialogDescription>{t("location.description")}</DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-3 overflow-y-auto px-6 pb-4">
          {/* Offline banner */}
          {isOffline && (
            <div className="rounded-md border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-xs text-amber-600 dark:text-amber-400">
              {t("location.offlineBanner")}
            </div>
          )}

          {/* Search */}
          <div className="relative">
            <Label htmlFor="loc-search" className="text-xs">
              {t("location.search")}
            </Label>
            <div className="relative mt-1">
              <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="loc-search"
                className="h-9 pl-8 pr-8"
                placeholder={t("location.searchPlaceholder")}
                value={searchQuery}
                onChange={(e) => handleSearchChange(e.target.value)}
                disabled={isOffline}
                aria-label={t("location.search")}
              />
              {isSearching && (
                <Loader2 className="absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 animate-spin text-muted-foreground" />
              )}
            </div>
            {searchResults.length > 0 && (
              <ul
                className="absolute z-50 mt-1 w-full rounded-md border border-border bg-popover shadow-md"
                role="listbox"
                aria-label={t("location.searchResults")}
              >
                {searchResults.map((result) => (
                  <li key={result.place_id}>
                    <button
                      type="button"
                      className="w-full truncate px-3 py-2 text-left text-xs hover:bg-accent hover:text-accent-foreground"
                      onClick={() => handleResultSelect(result)}
                    >
                      {result.display_name}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Map */}
          <div className="h-[260px] isolate overflow-hidden rounded-md border border-border sm:h-[320px]">
            {isMapLoading && (
              <div className="flex h-full items-center justify-center bg-muted">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            )}
            {!isMapLoading && MapComponent && (
              <MapComponent
                lat={lat}
                lon={lon}
                onMarkerMove={handleMarkerMove}
                onMapLoadError={() => setMapError(true)}
              />
            )}
            {mapError && (
              <p className="mt-1 px-2 text-xs text-muted-foreground">
                {t("location.mapUnavailable")}
              </p>
            )}
          </div>

          {/* Manual coordinate inputs */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label htmlFor="loc-lat" className="text-xs">
                {t("location.latitude")}
              </Label>
              <Input
                id="loc-lat"
                type="number"
                step="any"
                min={-90}
                max={90}
                className="h-9"
                value={lat}
                onChange={(e) => {
                  const v = parseFloat(e.target.value);
                  if (!Number.isNaN(v)) setLat(v);
                }}
                aria-label={t("location.latitude")}
              />
            </div>
            <div>
              <Label htmlFor="loc-lon" className="text-xs">
                {t("location.longitude")}
              </Label>
              <Input
                id="loc-lon"
                type="number"
                step="any"
                min={-180}
                max={180}
                className="h-9"
                value={lon}
                onChange={(e) => {
                  const v = parseFloat(e.target.value);
                  if (!Number.isNaN(v)) setLon(v);
                }}
                aria-label={t("location.longitude")}
              />
            </div>
          </div>

          {/* Place name */}
          <div>
            <Label htmlFor="loc-name" className="text-xs">
              {t("location.placeName")}
            </Label>
            <Input
              id="loc-name"
              className="h-9"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t("location.placeNamePlaceholder")}
            />
          </div>
        </div>

        <DialogFooter className="shrink-0 border-t border-border px-6 py-4">
          {onClear && hasExistingLocation && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="mr-auto text-muted-foreground"
              onClick={onClear}
            >
              <X className="mr-1.5 h-3.5 w-3.5" />
              {t("location.remove")}
            </Button>
          )}
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t("location.cancel")}
          </Button>
          <Button onClick={handleConfirm}>
            {hasExistingLocation
              ? t("location.update")
              : t("location.set")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
