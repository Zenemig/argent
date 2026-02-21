"use client";

import { useTranslations } from "next-intl";
import { ulid } from "ulid";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { syncAdd, syncUpdate } from "@/lib/sync-write";
import { FILM_FORMATS, DEFAULT_FRAME_COUNTS, LENS_MOUNTS, CAMERA_TYPES, SHUTTER_SPEEDS, METERING_MODES, formatLabel } from "@/lib/constants";

/** Timed shutter speeds only (no Bulb) — used for constraint selects */
const TIMED_SHUTTER_SPEEDS = SHUTTER_SPEEDS.filter((s) => s !== "B");
import { useUserId } from "@/hooks/useUserId";
import type { Camera, FilmFormat, LensMount, CameraType, ShutterSpeed, MeteringMode } from "@/lib/types";
import { useState } from "react";
import { toast } from "sonner";
import { trackEvent } from "@/lib/analytics/track-event";

interface CameraFormProps {
  camera?: Camera;
  onDone: () => void;
}

export function CameraForm({ camera, onDone }: CameraFormProps) {
  const t = useTranslations("gear");
  const tc = useTranslations("common");
  const userId = useUserId();
  const isEdit = !!camera;

  const [name, setName] = useState(camera?.name ?? "");
  const [make, setMake] = useState(camera?.make ?? "");
  const [format, setFormat] = useState<FilmFormat>(camera?.format ?? "35mm");
  const [mount, setMount] = useState<LensMount | "__none__">(camera?.mount ?? "__none__");
  const [type, setType] = useState<CameraType | "__none__">(camera?.type ?? "__none__");
  const [frameCount, setFrameCount] = useState(
    camera?.default_frame_count ?? DEFAULT_FRAME_COUNTS["35mm"],
  );
  const [shutterSpeedMin, setShutterSpeedMin] = useState<ShutterSpeed | "__none__">(camera?.shutter_speed_min ?? "__none__");
  const [shutterSpeedMax, setShutterSpeedMax] = useState<ShutterSpeed | "__none__">(camera?.shutter_speed_max ?? "__none__");
  const [hasBulb, setHasBulb] = useState<boolean | null>(camera?.has_bulb ?? null);
  const [meteringModes, setMeteringModes] = useState<MeteringMode[]>(camera?.metering_modes ?? []);
  const [notes, setNotes] = useState(camera?.notes ?? "");

  function handleFormatChange(value: string) {
    const fmt = value as FilmFormat;
    setFormat(fmt);
    if (!camera) {
      setFrameCount(DEFAULT_FRAME_COUNTS[fmt]);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!name.trim() || !make.trim()) return;

    const now = Date.now();

    if (isEdit && camera) {
      await syncUpdate("cameras", camera.id, {
        name: name.trim(),
        make: make.trim(),
        format,
        mount: mount === "__none__" ? null : mount,
        type: type === "__none__" ? null : type,
        shutter_speed_min: shutterSpeedMin === "__none__" ? null : shutterSpeedMin,
        shutter_speed_max: shutterSpeedMax === "__none__" ? null : shutterSpeedMax,
        has_bulb: hasBulb,
        metering_modes: meteringModes.length > 0 ? meteringModes : null,
        default_frame_count: frameCount,
        notes: notes.trim() || null,
        updated_at: now,
      });
      toast.success(t("cameraUpdated"));
    } else {
      await syncAdd("cameras", {
        id: ulid(),
        user_id: userId!,
        name: name.trim(),
        make: make.trim(),
        format,
        mount: mount === "__none__" ? null : mount,
        type: type === "__none__" ? null : type,
        shutter_speed_min: shutterSpeedMin === "__none__" ? null : shutterSpeedMin,
        shutter_speed_max: shutterSpeedMax === "__none__" ? null : shutterSpeedMax,
        has_bulb: hasBulb,
        metering_modes: meteringModes.length > 0 ? meteringModes : null,
        default_frame_count: frameCount,
        notes: notes.trim() || null,
        deleted_at: null,
        updated_at: now,
        created_at: now,
      });
      toast.success(t("cameraAdded"));
      trackEvent("first_camera_added");
    }

    onDone();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="camera-name">{t("name")}</Label>
        <Input
          id="camera-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Nikon FM2"
          required
          autoFocus
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="camera-make">{t("make")}</Label>
        <Input
          id="camera-make"
          value={make}
          onChange={(e) => setMake(e.target.value)}
          placeholder="Nikon"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="camera-format">{t("format")}</Label>
        <Select value={format} onValueChange={handleFormatChange}>
          <SelectTrigger id="camera-format">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {FILM_FORMATS.map((f) => (
              <SelectItem key={f} value={f}>
                {f}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="camera-mount">{t("mount")}</Label>
        <Select value={mount} onValueChange={(v) => setMount(v as LensMount | "__none__")}>
          <SelectTrigger id="camera-mount">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__none__">—</SelectItem>
            {LENS_MOUNTS.map((m) => (
              <SelectItem key={m} value={m}>
                {formatLabel(m)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="camera-type">{t("cameraType")}</Label>
        <Select value={type} onValueChange={(v) => setType(v as CameraType | "__none__")}>
          <SelectTrigger id="camera-type">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__none__">—</SelectItem>
            {CAMERA_TYPES.map((ct) => (
              <SelectItem key={ct} value={ct}>
                {formatLabel(ct)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="camera-shutter-min">{t("shutterSpeedMin")}</Label>
          <Select value={shutterSpeedMin} onValueChange={(v) => setShutterSpeedMin(v as ShutterSpeed | "__none__")}>
            <SelectTrigger id="camera-shutter-min">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__none__">—</SelectItem>
              {TIMED_SHUTTER_SPEEDS.map((s) => (
                <SelectItem key={s} value={s}>
                  {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="camera-shutter-max">{t("shutterSpeedMax")}</Label>
          <Select value={shutterSpeedMax} onValueChange={(v) => setShutterSpeedMax(v as ShutterSpeed | "__none__")}>
            <SelectTrigger id="camera-shutter-max">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__none__">—</SelectItem>
              {TIMED_SHUTTER_SPEEDS.map((s) => (
                <SelectItem key={s} value={s}>
                  {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Checkbox
          id="camera-bulb"
          checked={hasBulb === true}
          onCheckedChange={(checked) => setHasBulb(checked === true ? true : null)}
          aria-label={t("hasBulb")}
        />
        <Label htmlFor="camera-bulb" className="cursor-pointer">
          {t("hasBulb")}
        </Label>
      </div>

      <div className="space-y-2">
        <Label>{t("meteringModes")}</Label>
        <div className="flex flex-wrap gap-3">
          {METERING_MODES.map((mode) => (
            <div key={mode} className="flex items-center gap-1.5">
              <Checkbox
                id={`metering-${mode}`}
                checked={meteringModes.includes(mode)}
                onCheckedChange={(checked) => {
                  setMeteringModes((prev) =>
                    checked === true
                      ? [...prev, mode]
                      : prev.filter((m) => m !== mode),
                  );
                }}
                aria-label={mode}
              />
              <Label htmlFor={`metering-${mode}`} className="cursor-pointer text-sm">
                {formatLabel(mode)}
              </Label>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="camera-frames">{t("frameCount")}</Label>
        <Input
          id="camera-frames"
          type="number"
          min={1}
          max={100}
          value={frameCount}
          onChange={(e) => setFrameCount(Number(e.target.value))}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="camera-notes">{t("notes")}</Label>
        <Input
          id="camera-notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder=""
        />
      </div>

      <div className="flex gap-2 pt-2">
        <Button type="submit" className="flex-1">
          {isEdit ? tc("save") : tc("add")}
        </Button>
        <Button type="button" variant="outline" onClick={onDone}>
          {tc("cancel")}
        </Button>
      </div>
    </form>
  );
}
