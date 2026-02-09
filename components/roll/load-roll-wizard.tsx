"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useLiveQuery } from "dexie-react-hooks";
import { ulid } from "ulid";
import { Camera, Film, Settings2, Check } from "lucide-react";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { db } from "@/lib/db";
import { GUEST_USER_ID } from "@/lib/guest";
import { DEFAULT_FRAME_COUNTS } from "@/lib/constants";
import type { Camera as CameraType, FilmFormat } from "@/lib/types";
import { toast } from "sonner";

interface LoadRollWizardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type Step = "camera" | "film" | "configure";

interface FilmOption {
  id: string;
  brand: string;
  name: string;
  iso: number;
  process: string;
  isCustom: boolean;
}

export function LoadRollWizard({ open, onOpenChange }: LoadRollWizardProps) {
  const router = useRouter();
  const t = useTranslations("roll");
  const tc = useTranslations("common");

  const [step, setStep] = useState<Step>("camera");
  const [cameraId, setCameraId] = useState("");
  const [filmId, setFilmId] = useState("");
  const [ei, setEi] = useState(400);
  const [pushPull, setPushPull] = useState(0);
  const [lensId, setLensId] = useState("");
  const [notes, setNotes] = useState("");

  const cameras = useLiveQuery(
    () =>
      db.cameras
        .where("user_id")
        .equals(GUEST_USER_ID)
        .filter((c) => c.deleted_at === null || c.deleted_at === undefined)
        .toArray(),
    [],
  );

  const selectedCamera = useMemo(
    () => cameras?.find((c) => c.id === cameraId) ?? null,
    [cameras, cameraId],
  );

  const lenses = useLiveQuery(
    () =>
      db.lenses
        .where("user_id")
        .equals(GUEST_USER_ID)
        .filter(
          (l) =>
            (l.deleted_at === null || l.deleted_at === undefined) &&
            (l.camera_id === null ||
              l.camera_id === undefined ||
              l.camera_id === cameraId),
        )
        .toArray(),
    [cameraId],
  );

  const filmOptions = useLiveQuery(async (): Promise<FilmOption[]> => {
    if (!selectedCamera) return [];
    const format = selectedCamera.format;

    const stocks = await db.filmStock
      .filter((s) => s.format.includes(format as FilmFormat))
      .toArray();

    const customs = await db.films
      .where("user_id")
      .equals(GUEST_USER_ID)
      .filter(
        (f) =>
          (f.deleted_at === null || f.deleted_at === undefined) &&
          f.format === format,
      )
      .toArray();

    const options: FilmOption[] = [
      ...customs.map((f) => ({
        id: f.id,
        brand: f.brand,
        name: f.name,
        iso: f.iso,
        process: f.process,
        isCustom: true,
      })),
      ...stocks.map((s) => ({
        id: s.id,
        brand: s.brand,
        name: s.name,
        iso: s.iso,
        process: s.process,
        isCustom: false,
      })),
    ];

    return options;
  }, [selectedCamera]);

  const selectedFilm = useMemo(
    () => filmOptions?.find((f) => f.id === filmId) ?? null,
    [filmOptions, filmId],
  );

  function handleSelectCamera(cam: CameraType) {
    setCameraId(cam.id);
    setFilmId("");
    setStep("film");
  }

  function handleSelectFilm(film: FilmOption) {
    setFilmId(film.id);
    setEi(film.iso);
    setPushPull(0);
    setStep("configure");
  }

  async function handleCreate() {
    if (!selectedCamera || !selectedFilm) return;

    const now = Date.now();
    const id = ulid();

    await db.rolls.add({
      id,
      user_id: GUEST_USER_ID,
      camera_id: cameraId,
      film_id: filmId,
      lens_id: lensId || null,
      status: "loaded",
      frame_count: selectedCamera.default_frame_count,
      ei,
      push_pull: pushPull,
      lab_name: null,
      dev_notes: null,
      start_date: now,
      finish_date: null,
      develop_date: null,
      scan_date: null,
      notes: notes.trim() || null,
      deleted_at: null,
      updated_at: now,
      created_at: now,
    });

    toast.success(t("rollCreated"));
    resetAndClose();
    router.push(`/roll/${id}`);
  }

  function resetAndClose() {
    setStep("camera");
    setCameraId("");
    setFilmId("");
    setEi(400);
    setPushPull(0);
    setLensId("");
    setNotes("");
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={resetAndClose}>
      <DialogContent className="max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t("loadNew")}</DialogTitle>
        </DialogHeader>

        <div className="mb-4 flex items-center gap-2">
          {(["camera", "film", "configure"] as Step[]).map((s, i) => (
            <div key={s} className="flex items-center gap-2">
              {i > 0 && (
                <div className="h-px w-4 bg-border" />
              )}
              <div
                className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-medium ${
                  step === s
                    ? "bg-primary text-primary-foreground"
                    : (s === "camera" && (step === "film" || step === "configure")) ||
                        (s === "film" && step === "configure")
                      ? "bg-primary/20 text-primary"
                      : "bg-muted text-muted-foreground"
                }`}
              >
                {(s === "camera" && (step === "film" || step === "configure")) ||
                (s === "film" && step === "configure") ? (
                  <Check className="h-3.5 w-3.5" />
                ) : (
                  i + 1
                )}
              </div>
            </div>
          ))}
        </div>

        {step === "camera" && (
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              {t("selectCamera")}
            </p>
            {!cameras || cameras.length === 0 ? (
              <p className="py-4 text-center text-sm text-muted-foreground">
                {t("noCamera")}
              </p>
            ) : (
              cameras.map((cam) => (
                <Card
                  key={cam.id}
                  className="cursor-pointer transition-colors hover:bg-accent/50"
                  onClick={() => handleSelectCamera(cam)}
                >
                  <CardContent className="flex items-center gap-3 py-3">
                    <Camera className="h-5 w-5 text-muted-foreground" />
                    <div className="flex-1">
                      <p className="font-medium">{cam.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {cam.make} &middot; {cam.format} &middot;{" "}
                        {cam.default_frame_count} frames
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        )}

        {step === "film" && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                {t("selectFilm")}
              </p>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setStep("camera")}
              >
                {tc("back")}
              </Button>
            </div>
            {selectedCamera && (
              <Badge variant="outline" className="mb-2">
                {selectedCamera.name} ({selectedCamera.format})
              </Badge>
            )}
            {!filmOptions || filmOptions.length === 0 ? (
              <p className="py-4 text-center text-sm text-muted-foreground">
                {t("noFilm")}
              </p>
            ) : (
              <div className="max-h-64 space-y-1 overflow-y-auto">
                {filmOptions.map((film) => (
                  <div
                    key={film.id}
                    className="flex cursor-pointer items-center gap-3 rounded-lg border border-border px-3 py-2 transition-colors hover:bg-accent/50"
                    onClick={() => handleSelectFilm(film)}
                  >
                    <Film className="h-4 w-4 shrink-0 text-muted-foreground" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">
                        {film.brand} {film.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        ISO {film.iso} &middot; {film.process}
                      </p>
                    </div>
                    {film.isCustom && (
                      <Badge variant="secondary" className="text-xs">
                        Custom
                      </Badge>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {step === "configure" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">{t("configure")}</p>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setStep("film")}
              >
                {tc("back")}
              </Button>
            </div>

            {selectedCamera && selectedFilm && (
              <div className="flex gap-2">
                <Badge variant="outline">{selectedCamera.name}</Badge>
                <Badge variant="outline">
                  {selectedFilm.brand} {selectedFilm.name}
                </Badge>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="roll-ei">{t("ei")}</Label>
                <Input
                  id="roll-ei"
                  type="number"
                  min={1}
                  max={100000}
                  value={ei}
                  onChange={(e) => setEi(Number(e.target.value))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="roll-push">{t("pushPull")}</Label>
                <Select
                  value={String(pushPull)}
                  onValueChange={(v) => {
                    const pp = Number(v);
                    setPushPull(pp);
                    if (selectedFilm) {
                      setEi(
                        Math.round(selectedFilm.iso * Math.pow(2, pp)),
                      );
                    }
                  }}
                >
                  <SelectTrigger id="roll-push">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[-3, -2, -1, 0, 1, 2, 3].map((v) => (
                      <SelectItem key={v} value={String(v)}>
                        {v === 0 ? "Normal" : v > 0 ? `+${v}` : String(v)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {lenses && lenses.length > 0 && (
              <div className="space-y-2">
                <Label htmlFor="roll-lens">{t("defaultLens")}</Label>
                <Select value={lensId} onValueChange={setLensId}>
                  <SelectTrigger id="roll-lens">
                    <SelectValue placeholder="—" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">—</SelectItem>
                    {lenses.map((l) => (
                      <SelectItem key={l.id} value={l.id}>
                        {l.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="roll-notes">{t("devNotes")}</Label>
              <Input
                id="roll-notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>

            <Button onClick={handleCreate} className="w-full">
              {t("loadNew")}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
