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
import { db } from "@/lib/db";
import { GUEST_USER_ID } from "@/lib/guest";
import type { Lens, Camera } from "@/lib/types";
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
  const isEdit = !!lens;

  const [name, setName] = useState(lens?.name ?? "");
  const [make, setMake] = useState(lens?.make ?? "");
  const [focalLength, setFocalLength] = useState(lens?.focal_length ?? 50);
  const [maxAperture, setMaxAperture] = useState(lens?.max_aperture ?? 1.8);
  const [cameraId, setCameraId] = useState(lens?.camera_id ?? "__none__");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!name.trim() || !make.trim()) return;

    const now = Date.now();

    if (isEdit && lens) {
      await db.lenses.update(lens.id, {
        name: name.trim(),
        make: make.trim(),
        focal_length: focalLength,
        max_aperture: maxAperture,
        camera_id: cameraId === "__none__" ? null : cameraId,
        updated_at: now,
      });
      toast.success(t("lensUpdated"));
    } else {
      await db.lenses.add({
        id: ulid(),
        user_id: GUEST_USER_ID,
        name: name.trim(),
        make: make.trim(),
        focal_length: focalLength,
        max_aperture: maxAperture,
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
