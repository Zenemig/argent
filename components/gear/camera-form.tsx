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
import { syncAdd, syncUpdate } from "@/lib/sync-write";
import { FILM_FORMATS, DEFAULT_FRAME_COUNTS } from "@/lib/constants";
import { useUserId } from "@/hooks/useUserId";
import type { Camera, FilmFormat } from "@/lib/types";
import { useState } from "react";
import { toast } from "sonner";

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
  const [frameCount, setFrameCount] = useState(
    camera?.default_frame_count ?? DEFAULT_FRAME_COUNTS["35mm"],
  );
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
        default_frame_count: frameCount,
        notes: notes.trim() || null,
        updated_at: now,
      });
      toast.success(t("cameraUpdated"));
    } else {
      await syncAdd("cameras", {
        id: ulid(),
        user_id: userId,
        name: name.trim(),
        make: make.trim(),
        format,
        default_frame_count: frameCount,
        notes: notes.trim() || null,
        deleted_at: null,
        updated_at: now,
        created_at: now,
      });
      toast.success(t("cameraAdded"));
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
