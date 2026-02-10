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
import { syncAdd } from "@/lib/sync-write";
import { FILM_FORMATS, FILM_PROCESSES } from "@/lib/constants";
import { useUserId } from "@/hooks/useUserId";
import type { FilmFormat, FilmProcess } from "@/lib/types";
import { useState } from "react";
import { toast } from "sonner";

interface FilmFormProps {
  onDone: () => void;
}

export function FilmForm({ onDone }: FilmFormProps) {
  const t = useTranslations("gear");
  const tc = useTranslations("common");
  const userId = useUserId();

  const [brand, setBrand] = useState("");
  const [name, setName] = useState("");
  const [iso, setIso] = useState(400);
  const [format, setFormat] = useState<FilmFormat>("35mm");
  const [process, setProcess] = useState<FilmProcess>("C-41");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!brand.trim() || !name.trim()) return;

    const now = Date.now();

    await syncAdd("films", {
      id: ulid(),
      user_id: userId,
      brand: brand.trim(),
      name: name.trim(),
      iso,
      format,
      process,
      is_custom: true,
      deleted_at: null,
      updated_at: now,
      created_at: now,
    });

    toast.success(t("filmAdded"));
    onDone();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="film-brand">{t("brand")}</Label>
        <Input
          id="film-brand"
          value={brand}
          onChange={(e) => setBrand(e.target.value)}
          placeholder="Kodak"
          required
          autoFocus
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="film-name">{t("name")}</Label>
        <Input
          id="film-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Portra 400"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="film-iso">{t("iso")}</Label>
        <Input
          id="film-iso"
          type="number"
          min={1}
          max={100000}
          value={iso}
          onChange={(e) => setIso(Number(e.target.value))}
          required
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="film-format">{t("format")}</Label>
          <Select
            value={format}
            onValueChange={(v) => setFormat(v as FilmFormat)}
          >
            <SelectTrigger id="film-format">
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
          <Label htmlFor="film-process">{t("process")}</Label>
          <Select
            value={process}
            onValueChange={(v) => setProcess(v as FilmProcess)}
          >
            <SelectTrigger id="film-process">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {FILM_PROCESSES.map((p) => (
                <SelectItem key={p} value={p}>
                  {p}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex gap-2 pt-2">
        <Button type="submit" className="flex-1">
          {tc("add")}
        </Button>
        <Button type="button" variant="outline" onClick={onDone}>
          {tc("cancel")}
        </Button>
      </div>
    </form>
  );
}
