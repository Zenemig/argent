"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useTranslations } from "next-intl";
import { useLiveQuery } from "dexie-react-hooks";
import { ulid } from "ulid";
import { Camera, ImageOff, MapPin, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { db } from "@/lib/db";
import { syncAdd, syncUpdate } from "@/lib/sync-write";
import { toBlob } from "@/lib/image-sync";
import { EXPOSURE_COMP_VALUES } from "@/lib/constants";
import {
  filterShutterSpeeds,
  filterApertures,
  filterMeteringModes,
} from "@/lib/gear-filters";
import { cn } from "@/lib/utils";
import { LiveRegion } from "@/components/live-region";
import { isZoomLens, formatFocalLength, defaultFrameFocalLength } from "@/lib/lens-utils";
import type { Roll, Frame, Lens, MeteringMode } from "@/lib/types";
import { captureImage } from "@/lib/image-capture";
import { LocationPickerDialog } from "@/components/roll/location-picker-dialog";
import { toast } from "sonner";

interface ShotLoggerProps {
  roll: Roll;
}

/** Create an object URL from a thumbnail value, or null if not possible. */
function thumbnailUrl(thumbnail: Frame["thumbnail"]): string | null {
  const blob = toBlob(thumbnail);
  if (!blob) return null;
  return URL.createObjectURL(blob);
}

export function ShotLogger({ roll }: ShotLoggerProps) {
  const t = useTranslations("frame");
  const tc = useTranslations("common");

  const [shutterSpeed, setShutterSpeed] = useState("1/125");
  const [aperture, setAperture] = useState(5.6);
  const [lensId, setLensId] = useState(roll.lens_id ?? "__none__");
  const [meteringMode, setMeteringMode] = useState<string>("__none__");
  const [exposureComp, setExposureComp] = useState(0);
  const [filter, setFilter] = useState("");
  const [note, setNote] = useState("");
  const [showExceedWarning, setShowExceedWarning] = useState(false);
  const [frameFocalLength, setFrameFocalLength] = useState<number | null>(null);

  // Image capture state
  const [capturedThumbnail, setCapturedThumbnail] = useState<Blob | null>(null);
  const [previewImage, setPreviewImage] = useState<{
    url: string;
    frameNumber?: number;
  } | null>(null);

  // Location picker state
  const [locationPickerOpen, setLocationPickerOpen] = useState(false);
  const [locationPickerFrameId, setLocationPickerFrameId] = useState<string | null>(null);
  const [pickerInitialLat, setPickerInitialLat] = useState<number | null>(null);
  const [pickerInitialLon, setPickerInitialLon] = useState<number | null>(null);
  const [pickerInitialName, setPickerInitialName] = useState<string | null>(null);
  const [locationDisplay, setLocationDisplay] = useState<string>("");

  const locationRef = useRef<{ lat: number; lon: number } | null>(null);
  const locationNameRef = useRef<string>("");
  const watchIdRef = useRef<number | null>(null);

  const frames = useLiveQuery(
    () =>
      db.frames.where("roll_id").equals(roll.id).sortBy("frame_number"),
    [roll.id],
  );

  const camera = useLiveQuery(
    () => db.cameras.get(roll.camera_id),
    [roll.camera_id],
  );

  const lenses = useLiveQuery(async () => {
    const all = await db.lenses
      .where("user_id")
      .equals(roll.user_id)
      .filter(
        (l) =>
          (l.deleted_at === null || l.deleted_at === undefined) &&
          (l.camera_id === null ||
            l.camera_id === undefined ||
            l.camera_id === roll.camera_id),
      )
      .toArray();
    return all;
  }, [roll.user_id, roll.camera_id]);

  // Auto-fill from last frame
  useEffect(() => {
    if (frames && frames.length > 0) {
      const last = frames[frames.length - 1];
      setShutterSpeed(last.shutter_speed);
      setAperture(last.aperture);
      if (last.lens_id) setLensId(last.lens_id);
      if (last.metering_mode) setMeteringMode(last.metering_mode);
      if (last.exposure_comp !== null && last.exposure_comp !== undefined)
        setExposureComp(last.exposure_comp);
      if (last.filter) setFilter(last.filter);
    }
  }, [frames?.length]);

  // Geolocation watcher
  useEffect(() => {
    if ("geolocation" in navigator) {
      watchIdRef.current = navigator.geolocation.watchPosition(
        (pos) => {
          locationRef.current = {
            lat: pos.coords.latitude,
            lon: pos.coords.longitude,
          };
        },
        () => {
          // Permission denied or error - silently continue
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 30000 },
      );
    }

    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, []);

  // Build object URLs for frame thumbnails (revoke on change)
  const frameThumbUrls = useMemo(() => {
    if (!frames) return new Map<string, string>();
    const map = new Map<string, string>();
    for (const frame of frames) {
      if (frame.thumbnail) {
        const url = thumbnailUrl(frame.thumbnail);
        if (url) map.set(frame.id, url);
      }
    }
    return map;
  }, [frames]);

  // Revoke old thumbnail URLs when frames change
  const prevUrlsRef = useRef<Map<string, string>>(new Map());
  useEffect(() => {
    const prev = prevUrlsRef.current;
    for (const [id, url] of prev) {
      if (!frameThumbUrls.has(id) || frameThumbUrls.get(id) !== url) {
        URL.revokeObjectURL(url);
      }
    }
    prevUrlsRef.current = frameThumbUrls;
    return () => {
      for (const url of frameThumbUrls.values()) {
        URL.revokeObjectURL(url);
      }
    };
  }, [frameThumbUrls]);

  // Preview URL for captured thumbnail (before save)
  const capturedThumbUrl = useMemo(() => {
    if (!capturedThumbnail) return null;
    return URL.createObjectURL(capturedThumbnail);
  }, [capturedThumbnail]);

  useEffect(() => {
    return () => {
      if (capturedThumbUrl) URL.revokeObjectURL(capturedThumbUrl);
    };
  }, [capturedThumbUrl]);

  // Derive selected lens for zoom detection
  const selectedLens: Lens | null = useMemo(() => {
    if (!lenses || lensId === "__none__") return null;
    return lenses.find((l) => l.id === lensId) ?? null;
  }, [lenses, lensId]);

  // Filtered options based on gear constraints
  const filteredShutterSpeeds = useMemo(
    () => filterShutterSpeeds(camera?.shutter_speed_min, camera?.shutter_speed_max, camera?.has_bulb),
    [camera?.shutter_speed_min, camera?.shutter_speed_max, camera?.has_bulb],
  );

  const filteredApertures = useMemo(
    () => filterApertures(selectedLens?.max_aperture, selectedLens?.aperture_min),
    [selectedLens?.max_aperture, selectedLens?.aperture_min],
  );

  const filteredMeteringModes = useMemo(
    () => filterMeteringModes(camera?.metering_modes),
    [camera?.metering_modes],
  );

  // Update focal length default when lens changes
  useEffect(() => {
    if (selectedLens && isZoomLens(selectedLens)) {
      setFrameFocalLength(defaultFrameFocalLength(selectedLens));
    } else {
      setFrameFocalLength(null);
    }
  }, [selectedLens]);

  const nextFrameNumber = (frames?.length ?? 0) + 1;

  // ----- Image capture handlers -----

  async function captureWithErrorHandling(): Promise<Blob | null> {
    // captureImage is statically imported — dynamic import here would break
    // the iOS Safari user-gesture chain before input.click().
    const result = await captureImage();
    if ("error" in result) {
      if (result.error !== "no_file") {
        toast.error(t(`captureError.${result.error}`));
      }
      return null;
    }
    return result.blob;
  }

  async function handleCaptureImage() {
    const blob = await captureWithErrorHandling();
    if (!blob) return;
    setCapturedThumbnail(blob);
    toast.success(t("imageReady"));
  }

  async function handleAddImageToFrame(frameId: string) {
    const blob = await captureWithErrorHandling();
    if (!blob) return;
    await syncUpdate("frames", frameId, { thumbnail: blob });
    toast.success(t("imageAdded"));
  }

  function handleViewThumbnail(url: string, frameNumber: number) {
    setPreviewImage({ url, frameNumber });
  }

  function handleViewCaptured() {
    if (capturedThumbUrl) {
      setPreviewImage({ url: capturedThumbUrl, frameNumber: undefined });
    }
  }

  function handleRemoveCaptured() {
    setCapturedThumbnail(null);
    toast.success(t("imageRemoved"));
  }

  // ----- Location picker handlers -----

  function handleOpenNewFrameLocationPicker() {
    const loc = locationRef.current;
    setPickerInitialLat(loc?.lat ?? null);
    setPickerInitialLon(loc?.lon ?? null);
    setPickerInitialName(locationNameRef.current || null);
    setLocationPickerFrameId(null);
    setLocationPickerOpen(true);
  }

  function handleOpenFrameLocationPicker(frame: Frame) {
    setPickerInitialLat(frame.latitude ?? null);
    setPickerInitialLon(frame.longitude ?? null);
    setPickerInitialName(frame.location_name ?? null);
    setLocationPickerFrameId(frame.id);
    setLocationPickerOpen(true);
  }

  async function handleLocationConfirm(lat: number, lon: number, name: string) {
    if (locationPickerFrameId) {
      await syncUpdate("frames", locationPickerFrameId, {
        latitude: lat,
        longitude: lon,
        location_name: name || null,
        updated_at: Date.now(),
      });
      setLocationPickerFrameId(null);
    } else {
      locationRef.current = { lat, lon };
      locationNameRef.current = name;
      setLocationDisplay(name || `${lat.toFixed(4)}, ${lon.toFixed(4)}`);
    }
    setLocationPickerOpen(false);
  }

  async function handleLocationClear() {
    if (locationPickerFrameId) {
      await syncUpdate("frames", locationPickerFrameId, {
        latitude: null,
        longitude: null,
        location_name: null,
        updated_at: Date.now(),
      });
      setLocationPickerFrameId(null);
    } else {
      locationRef.current = null;
      locationNameRef.current = "";
      setLocationDisplay("");
    }
    setLocationPickerOpen(false);
  }

  // ----- Save frame -----

  const saveFrame = useCallback(async () => {
    const now = Date.now();
    const loc = locationRef.current;

    await syncAdd("frames", {
      id: ulid(),
      roll_id: roll.id,
      frame_number: nextFrameNumber,
      shutter_speed: shutterSpeed,
      aperture,
      lens_id: lensId === "__none__" ? null : lensId,
      focal_length: frameFocalLength,
      metering_mode: meteringMode === "__none__" ? null : (meteringMode as MeteringMode),
      exposure_comp: exposureComp,
      filter: filter.trim() || null,
      latitude: loc?.lat ?? null,
      longitude: loc?.lon ?? null,
      location_name: locationNameRef.current || null,
      notes: note.trim() || null,
      thumbnail: capturedThumbnail,
      image_url: null,
      captured_at: now,
      updated_at: now,
      created_at: now,
    });

    // Update roll status to active if it's loaded
    if (roll.status === "loaded") {
      await syncUpdate("rolls", roll.id, {
        status: "active",
        updated_at: now,
      });
    }

    setNote("");
    setFilter("");
    setCapturedThumbnail(null);
    setLocationDisplay("");
    locationNameRef.current = "";
    locationRef.current = null;
    toast.success(t("frameNumber", { number: nextFrameNumber }));
  }, [
    roll.id,
    roll.status,
    roll.user_id,
    nextFrameNumber,
    shutterSpeed,
    aperture,
    lensId,
    frameFocalLength,
    meteringMode,
    exposureComp,
    filter,
    note,
    capturedThumbnail,
    t,
  ]);

  function handleSaveClick() {
    if (nextFrameNumber > roll.frame_count) {
      setShowExceedWarning(true);
      return;
    }
    saveFrame();
  }

  const canLog =
    roll.status === "loaded" || roll.status === "active";

  return (
    <div className="space-y-4 lg:flex lg:gap-6 lg:space-y-0">
      {/* Frame timeline */}
      <div className="lg:flex-1 lg:min-w-0">
      {frames && frames.length > 0 && (
        <ScrollArea className="max-h-48 lg:max-h-[calc(100vh-16rem)]">
          <div className="space-y-1">
            {frames.map((frame) => {
              const thumbUrl = frameThumbUrls.get(frame.id);
              return (
                <div
                  key={frame.id}
                  className="flex items-center gap-2 rounded border border-border px-3 py-1.5 text-sm"
                >
                  <Badge variant="outline" className="shrink-0 tabular-nums">
                    #{frame.frame_number}
                  </Badge>
                  {thumbUrl ? (
                    <button
                      type="button"
                      onClick={() =>
                        handleViewThumbnail(thumbUrl, frame.frame_number)
                      }
                      className="shrink-0 overflow-hidden rounded"
                      aria-label={t("frameThumbnail", {
                        number: frame.frame_number,
                      })}
                    >
                      <img
                        src={thumbUrl}
                        alt=""
                        className="h-8 w-8 object-cover"
                      />
                    </button>
                  ) : canLog ? (
                    <button
                      type="button"
                      onClick={() => handleAddImageToFrame(frame.id)}
                      className="flex h-8 w-8 shrink-0 items-center justify-center rounded border border-dashed border-muted-foreground/40 text-muted-foreground hover:border-primary hover:text-primary"
                      aria-label={t("captureImage")}
                    >
                      <Camera className="h-3.5 w-3.5" />
                    </button>
                  ) : null}
                  <span className="tabular-nums">{frame.shutter_speed}</span>
                  <span className="text-muted-foreground">f/{frame.aperture}</span>
                  {frame.latitude != null && (
                    <button
                      type="button"
                      onClick={() => handleOpenFrameLocationPicker(frame)}
                      aria-label={t("location.editLocation")}
                      className="shrink-0 text-muted-foreground hover:text-primary"
                    >
                      <MapPin className="h-3 w-3" />
                    </button>
                  )}
                  {frame.notes && (
                    <span className="truncate text-xs text-muted-foreground">
                      {frame.notes}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </ScrollArea>
      )}
      </div>

      {/* Log controls */}
      {canLog && (
        <div className={cn(
          "fixed inset-x-0 bottom-16 z-40 border-t border-border bg-background p-4",
          "lg:static lg:inset-auto lg:z-auto lg:w-[28rem] lg:shrink-0 lg:self-start lg:sticky lg:top-8 lg:rounded-lg lg:border lg:bg-card lg:p-6"
        )}>
          <div className="mx-auto max-w-lg space-y-3 lg:mx-0 lg:max-w-none lg:space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">
                {t("frameNumber", { number: nextFrameNumber })}
              </span>
              <span className="text-xs text-muted-foreground">
                {nextFrameNumber}/{roll.frame_count}
              </span>
              <LiveRegion>
                {t("frameNumber", { number: nextFrameNumber })} — {nextFrameNumber}/{roll.frame_count}
              </LiveRegion>
            </div>

            <div className="grid grid-cols-2 gap-2 lg:gap-3">
              <div>
                <Label className="text-xs">{t("shutterSpeed")}</Label>
                <Select value={shutterSpeed} onValueChange={setShutterSpeed}>
                  <SelectTrigger className="h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {filteredShutterSpeeds.map((s) => (
                      <SelectItem key={s} value={s}>
                        {s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-xs">{t("aperture")}</Label>
                <Select
                  value={String(aperture)}
                  onValueChange={(v) => setAperture(Number(v))}
                >
                  <SelectTrigger className="h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {filteredApertures.map((a) => (
                      <SelectItem key={a} value={String(a)}>
                        f/{a}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 lg:gap-3">
              {lenses && lenses.length > 0 && (
                <div>
                  <Label className="text-xs">{t("lens")}</Label>
                  <Select value={lensId} onValueChange={setLensId}>
                    <SelectTrigger className="h-9">
                      <SelectValue placeholder="—" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none__">—</SelectItem>
                      {lenses.map((l) => (
                        <SelectItem key={l.id} value={l.id}>
                          {formatFocalLength(l)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div>
                <Label className="text-xs">{t("meteringMode")}</Label>
                <Select value={meteringMode} onValueChange={setMeteringMode}>
                  <SelectTrigger className="h-9">
                    <SelectValue placeholder="—" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">—</SelectItem>
                    {filteredMeteringModes.map((m) => (
                      <SelectItem key={m} value={m}>
                        {t(`metering.${m}`)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-xs">{t("exposureComp")}</Label>
                <Select
                  value={String(exposureComp)}
                  onValueChange={(v) => setExposureComp(Number(v))}
                >
                  <SelectTrigger className="h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {EXPOSURE_COMP_VALUES.map((v) => (
                      <SelectItem key={v} value={String(v)}>
                        {v === 0 ? "0" : v > 0 ? `+${v}` : String(v)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {selectedLens && isZoomLens(selectedLens) && (
              <div className="w-32">
                <Label htmlFor="frame-focal-length" className="text-xs">
                  {t("focalLengthUsed")}
                </Label>
                <Input
                  id="frame-focal-length"
                  type="number"
                  min={selectedLens.focal_length}
                  max={selectedLens.focal_length_max ?? undefined}
                  value={frameFocalLength ?? ""}
                  onChange={(e) => setFrameFocalLength(Number(e.target.value))}
                  className="h-9"
                  aria-label={t("focalLengthUsed")}
                />
              </div>
            )}

            <div className="flex gap-2 lg:gap-3">
              <Input
                placeholder={t("note")}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className="h-9"
              />
              <Input
                placeholder={t("filterUsed")}
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="h-9 w-28"
              />
            </div>

            {/* Location row */}
            <button
              type="button"
              onClick={handleOpenNewFrameLocationPicker}
              className="flex h-9 w-full items-center gap-2 rounded-md border border-border px-3 text-sm text-muted-foreground hover:border-primary hover:text-primary"
              aria-label={locationDisplay ? t("location.editLocation") : t("location.setLocation")}
            >
              <MapPin className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">
                {locationDisplay || t("location.placeholder")}
              </span>
            </button>

            {/* Camera capture + save row */}
            <div className="flex gap-2 lg:gap-3">
              {capturedThumbnail && capturedThumbUrl ? (
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={handleViewCaptured}
                    className="shrink-0 overflow-hidden rounded border border-primary"
                    aria-label={t("imagePreview")}
                  >
                    <img
                      src={capturedThumbUrl}
                      alt=""
                      className="h-9 w-9 object-cover"
                    />
                  </button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9"
                    onClick={handleRemoveCaptured}
                    aria-label={t("removeImage")}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="h-9 w-9 shrink-0"
                  onClick={handleCaptureImage}
                  aria-label={t("captureImage")}
                >
                  <Camera className="h-4 w-4" />
                </Button>
              )}
              <Button onClick={handleSaveClick} className="min-w-0 flex-1">
                {t("save")}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Image preview dialog */}
      <Dialog
        open={!!previewImage}
        onOpenChange={(open) => {
          if (!open) setPreviewImage(null);
        }}
      >
        <DialogContent className="flex h-[80vh] w-[80vw] sm:max-w-none flex-col overflow-hidden">
          <DialogHeader className="shrink-0">
            <DialogTitle>
              {previewImage?.frameNumber
                ? t("frameImagePreview", { number: previewImage.frameNumber })
                : t("imagePreview")}
            </DialogTitle>
            <DialogDescription className="sr-only">
              {t("imagePreview")}
            </DialogDescription>
          </DialogHeader>
          {previewImage && (
            <img
              src={previewImage.url}
              alt=""
              className="min-h-0 flex-1 rounded-md object-contain"
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Frame count exceeded warning */}
      <AlertDialog
        open={showExceedWarning}
        onOpenChange={setShowExceedWarning}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{tc("confirm")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("exceedWarning")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{tc("cancel")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                setShowExceedWarning(false);
                saveFrame();
              }}
            >
              {tc("confirm")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Location picker dialog */}
      <LocationPickerDialog
        open={locationPickerOpen}
        onOpenChange={setLocationPickerOpen}
        initialLat={pickerInitialLat}
        initialLon={pickerInitialLon}
        initialName={pickerInitialName}
        onConfirm={handleLocationConfirm}
        onClear={handleLocationClear}
      />
    </div>
  );
}
