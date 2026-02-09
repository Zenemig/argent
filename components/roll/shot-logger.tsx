"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useTranslations } from "next-intl";
import { useLiveQuery } from "dexie-react-hooks";
import { ulid } from "ulid";
import { MapPin } from "lucide-react";
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
import { ScrollArea } from "@/components/ui/scroll-area";
import { db } from "@/lib/db";
import {
  SHUTTER_SPEEDS,
  APERTURES,
  METERING_MODES,
  EXPOSURE_COMP_VALUES,
} from "@/lib/constants";
import type { Roll, MeteringMode } from "@/lib/types";
import { toast } from "sonner";

interface ShotLoggerProps {
  roll: Roll;
}

export function ShotLogger({ roll }: ShotLoggerProps) {
  const t = useTranslations("frame");
  const tc = useTranslations("common");

  const [shutterSpeed, setShutterSpeed] = useState("1/125");
  const [aperture, setAperture] = useState(5.6);
  const [lensId, setLensId] = useState(roll.lens_id ?? "");
  const [meteringMode, setMeteringMode] = useState<string>("");
  const [exposureComp, setExposureComp] = useState(0);
  const [filter, setFilter] = useState("");
  const [note, setNote] = useState("");
  const [showExceedWarning, setShowExceedWarning] = useState(false);

  const locationRef = useRef<{ lat: number; lon: number } | null>(null);
  const locationNameRef = useRef<string>("");
  const watchIdRef = useRef<number | null>(null);

  const frames = useLiveQuery(
    () =>
      db.frames.where("roll_id").equals(roll.id).sortBy("frame_number"),
    [roll.id],
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

  const nextFrameNumber = (frames?.length ?? 0) + 1;

  const saveFrame = useCallback(async () => {
    const now = Date.now();
    const loc = locationRef.current;

    await db.frames.add({
      id: ulid(),
      roll_id: roll.id,
      frame_number: nextFrameNumber,
      shutter_speed: shutterSpeed,
      aperture,
      lens_id: lensId || null,
      metering_mode: (meteringMode as MeteringMode) || null,
      exposure_comp: exposureComp,
      filter: filter.trim() || null,
      latitude: loc?.lat ?? null,
      longitude: loc?.lon ?? null,
      location_name: locationNameRef.current || null,
      notes: note.trim() || null,
      thumbnail: null,
      image_url: null,
      captured_at: now,
      updated_at: now,
      created_at: now,
    });

    // Update roll status to active if it's loaded
    if (roll.status === "loaded") {
      await db.rolls.update(roll.id, {
        status: "active",
        updated_at: now,
      });
    }

    setNote("");
    setFilter("");
    toast.success(t("frameNumber", { number: nextFrameNumber }));
  }, [
    roll.id,
    roll.status,
    nextFrameNumber,
    shutterSpeed,
    aperture,
    lensId,
    meteringMode,
    exposureComp,
    filter,
    note,
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
    <div className="space-y-4">
      {/* Frame timeline */}
      {frames && frames.length > 0 && (
        <ScrollArea className="max-h-48">
          <div className="space-y-1">
            {frames.map((frame) => (
              <div
                key={frame.id}
                className="flex items-center gap-2 rounded border border-border px-3 py-1.5 text-sm"
              >
                <Badge variant="outline" className="shrink-0 tabular-nums">
                  #{frame.frame_number}
                </Badge>
                <span className="tabular-nums">{frame.shutter_speed}</span>
                <span className="text-muted-foreground">f/{frame.aperture}</span>
                {frame.latitude && (
                  <MapPin className="h-3 w-3 text-muted-foreground" />
                )}
                {frame.notes && (
                  <span className="truncate text-xs text-muted-foreground">
                    {frame.notes}
                  </span>
                )}
              </div>
            ))}
          </div>
        </ScrollArea>
      )}

      {/* Log controls */}
      {canLog && (
        <div className="fixed inset-x-0 bottom-16 z-40 border-t border-border bg-background p-4">
          <div className="mx-auto max-w-lg space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">
                {t("frameNumber", { number: nextFrameNumber })}
              </span>
              <span className="text-xs text-muted-foreground">
                {nextFrameNumber}/{roll.frame_count}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-xs">{t("shutterSpeed")}</Label>
                <Select value={shutterSpeed} onValueChange={setShutterSpeed}>
                  <SelectTrigger className="h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {SHUTTER_SPEEDS.map((s) => (
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
                    {APERTURES.map((a) => (
                      <SelectItem key={a} value={String(a)}>
                        f/{a}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2">
              {lenses && lenses.length > 0 && (
                <div>
                  <Label className="text-xs">{t("lens")}</Label>
                  <Select value={lensId} onValueChange={setLensId}>
                    <SelectTrigger className="h-9">
                      <SelectValue placeholder="—" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">—</SelectItem>
                      {lenses.map((l) => (
                        <SelectItem key={l.id} value={l.id}>
                          {l.focal_length}mm
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
                    <SelectItem value="">—</SelectItem>
                    {METERING_MODES.map((m) => (
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

            <div className="flex gap-2">
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

            <Button onClick={handleSaveClick} className="w-full">
              {t("save")}
            </Button>
          </div>
        </div>
      )}

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
    </div>
  );
}
