"use client";

import { useTranslations } from "next-intl";
import { ulid } from "ulid";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { syncAdd, syncUpdate } from "@/lib/sync-write";
import { LENS_MOUNTS, formatLabel } from "@/lib/constants";
import { useUserId } from "@/hooks/useUserId";
import type { Lens, Camera, LensMount } from "@/lib/types";
import { useState } from "react";
import { toast } from "sonner";

interface LensFormProps {
  lens?: Lens;
  cameras: Camera[];
  onDone: () => void;
}

export function LensForm({ lens, cameras, onDone }: LensFormProps) {
  const t = useTranslations("gear");
  const tc = useTranslations("common");
  const userId = useUserId();
  const isEdit = !!lens;

  const [name, setName] = useState(lens?.name ?? "");
  const [make, setMake] = useState(lens?.make ?? "");
  const [mount, setMount] = useState<LensMount | "__none__">(lens?.mount ?? "__none__");
  const [focalLength, setFocalLength] = useState(lens?.focal_length ?? 50);
  const [maxAperture, setMaxAperture] = useState(lens?.max_aperture ?? 1.8);
  const [isZoom, setIsZoom] = useState(lens?.focal_length_max != null);
  const [focalLengthMax, setFocalLengthMax] = useState(lens?.focal_length_max ?? 100);
  const [minAperture, setMinAperture] = useState(lens?.min_aperture ?? maxAperture);
  const [apertureMin, setApertureMin] = useState<number | "">(lens?.aperture_min ?? "");
  const [cameraId, setCameraId] = useState(lens?.camera_id ?? "__none__");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!name.trim() || !make.trim()) return;

    const now = Date.now();
    const zoomFields = isZoom
      ? { focal_length_max: focalLengthMax, min_aperture: minAperture }
      : { focal_length_max: null, min_aperture: null };

    if (isEdit && lens) {
      await syncUpdate("lenses", lens.id, {
        name: name.trim(),
        make: make.trim(),
        mount: mount === "__none__" ? null : mount,
        focal_length: focalLength,
        max_aperture: maxAperture,
        ...zoomFields,
        aperture_min: apertureMin === "" ? null : apertureMin,
        camera_id: cameraId === "__none__" ? null : cameraId,
        updated_at: now,
      });
      toast.success(t("lensUpdated"));
    } else {
      await syncAdd("lenses", {
        id: ulid(),
        user_id: userId!,
        name: name.trim(),
        make: make.trim(),
        mount: mount === "__none__" ? null : mount,
        focal_length: focalLength,
        max_aperture: maxAperture,
        ...zoomFields,
        aperture_min: apertureMin === "" ? null : apertureMin,
        camera_id: cameraId === "__none__" ? null : cameraId,
        deleted_at: null,
        updated_at: now,
        created_at: now,
      });
      toast.success(t("lensAdded"));
    }

    onDone();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="lens-name">{t("name")}</Label>
        <Input
          id="lens-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Nikkor 50mm f/1.4 AI-S"
          required
          autoFocus
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="lens-make">{t("make")}</Label>
        <Input
          id="lens-make"
          value={make}
          onChange={(e) => setMake(e.target.value)}
          placeholder="Nikon"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="lens-mount">{t("mount")}</Label>
        <Select value={mount} onValueChange={(v) => setMount(v as LensMount | "__none__")}>
          <SelectTrigger id="lens-mount">
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

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="lens-focal">{t("focalLength")}</Label>
          <Input
            id="lens-focal"
            type="number"
            min={1}
            max={2000}
            value={focalLength}
            onChange={(e) => setFocalLength(Number(e.target.value))}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="lens-aperture">{t("maxAperture")}</Label>
          <Input
            id="lens-aperture"
            type="number"
            min={0.7}
            max={64}
            step={0.1}
            value={maxAperture}
            onChange={(e) => setMaxAperture(Number(e.target.value))}
            required
          />
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Checkbox
          id="lens-zoom"
          checked={isZoom}
          onCheckedChange={(checked) => setIsZoom(checked === true)}
          aria-label={t("zoomLens")}
        />
        <Label htmlFor="lens-zoom" className="cursor-pointer">
          {t("zoomLens")}
        </Label>
      </div>

      {isZoom && (
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="lens-focal-max">{t("focalLengthMax")}</Label>
            <Input
              id="lens-focal-max"
              type="number"
              min={focalLength + 1}
              max={2000}
              value={focalLengthMax}
              onChange={(e) => setFocalLengthMax(Number(e.target.value))}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="lens-min-aperture">{t("minAperture")}</Label>
            <Input
              id="lens-min-aperture"
              type="number"
              min={maxAperture}
              max={64}
              step={0.1}
              value={minAperture}
              onChange={(e) => setMinAperture(Number(e.target.value))}
            />
          </div>
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="lens-aperture-min">{t("apertureMin")}</Label>
        <Input
          id="lens-aperture-min"
          type="number"
          min={1}
          max={128}
          step={0.1}
          value={apertureMin}
          onChange={(e) =>
            setApertureMin(e.target.value === "" ? "" : Number(e.target.value))
          }
          placeholder="16"
          aria-label={t("apertureMin")}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="lens-camera">{t("linkedCamera")}</Label>
        <Select value={cameraId} onValueChange={setCameraId}>
          <SelectTrigger id="lens-camera">
            <SelectValue placeholder={t("universal")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__none__">{t("universal")}</SelectItem>
            {cameras.map((cam) => (
              <SelectItem key={cam.id} value={cam.id}>
                {cam.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
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
