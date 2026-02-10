"use client";

import { useState, useCallback } from "react";
import { useTranslations } from "next-intl";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { db } from "@/lib/db";
import { getSetting } from "@/lib/settings-helpers";
import type { ExportInput, ExportOptions } from "@/lib/exporters/types";

export type ExportFormat = "xmp" | "csv" | "script" | "json";

interface ExportDialogProps {
  rollId: string;
  frameCount: number;
  format: ExportFormat;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function resolveFilenames(
  mode: "pattern" | "list",
  pattern: string,
  fileList: string,
  count: number,
): string[] {
  if (mode === "list") {
    return fileList
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);
  }

  return Array.from({ length: count }, (_, i) => {
    const num = String(i + 1).padStart(3, "0");
    return pattern.replace(/\{frame_number\}/g, num);
  });
}

function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

const FORMAT_TITLES: Record<ExportFormat, string> = {
  xmp: "xmp",
  csv: "csv",
  script: "script",
  json: "json",
};

/** Fetch all data needed for export from Dexie. */
async function fetchExportData(
  rollId: string,
  mode: "pattern" | "list",
  pattern: string,
  fileList: string,
): Promise<{ inputs: ExportInput[]; options: ExportOptions; filmLabel: string }> {
  const roll = await db.rolls.get(rollId);
  if (!roll) throw new Error("Roll not found");

  const frames = await db.frames
    .where("roll_id")
    .equals(rollId)
    .sortBy("frame_number");

  if (frames.length === 0) throw new Error("NO_FRAMES");

  const filenames = resolveFilenames(mode, pattern, fileList, frames.length);

  const camera = await db.cameras.get(roll.camera_id);
  if (!camera) throw new Error("Camera not found");

  const customFilm = await db.films.get(roll.film_id);
  const seedFilm = customFilm ? null : await db.filmStock.get(roll.film_id);
  const filmSource = customFilm ?? seedFilm;
  if (!filmSource) throw new Error("Film not found");

  // Batch-fetch lenses
  const lensIds = new Set<string>();
  if (roll.lens_id) lensIds.add(roll.lens_id);
  for (const f of frames) {
    if (f.lens_id) lensIds.add(f.lens_id);
  }
  const lensRecords = await db.lenses.bulkGet([...lensIds]);
  const lensMap = new Map(
    lensRecords
      .filter((l): l is NonNullable<typeof l> => l != null)
      .map((l) => [l.id, l]),
  );

  const displayName = await getSetting("displayName");
  const copyright = await getSetting("copyright");

  const inputs: ExportInput[] = frames.map((frame, i) => {
    const lensRecord =
      lensMap.get(frame.lens_id ?? "") ??
      lensMap.get(roll.lens_id ?? "") ??
      null;

    return {
      frame: {
        frameNumber: frame.frame_number,
        shutterSpeed: frame.shutter_speed,
        aperture: frame.aperture,
        focalLength: lensRecord?.focal_length ?? null,
        latitude: frame.latitude,
        longitude: frame.longitude,
        locationName: frame.location_name,
        notes: frame.notes,
        capturedAt: frame.captured_at,
      },
      roll: {
        id: roll.id,
        ei: roll.ei,
        pushPull: roll.push_pull,
        status: roll.status,
        frameCount: roll.frame_count,
        startDate: roll.start_date,
        finishDate: roll.finish_date,
        developDate: roll.develop_date,
        scanDate: roll.scan_date,
        labName: roll.lab_name,
        devNotes: roll.dev_notes,
        notes: roll.notes,
      },
      camera: {
        make: camera.make,
        name: camera.name,
        format: camera.format,
      },
      lens: lensRecord
        ? {
            name: lensRecord.name,
            make: lensRecord.make,
            focalLength: lensRecord.focal_length,
            maxAperture: lensRecord.max_aperture,
          }
        : null,
      film: {
        brand: filmSource.brand,
        name: filmSource.name,
        iso: filmSource.iso,
      },
      filename: filenames[i],
    };
  });

  return {
    inputs,
    options: { creatorName: displayName, copyright },
    filmLabel: `${filmSource.brand}_${filmSource.name}`.replace(/\s+/g, "_"),
  };
}

/** Generate the export file(s) and trigger download based on format. */
async function generateAndDownload(
  format: ExportFormat,
  inputs: ExportInput[],
  options: ExportOptions,
  filmLabel: string,
): Promise<void> {
  if (format === "xmp") {
    const [{ generateXMPBatch }, JSZip] = await Promise.all([
      import("@/lib/exporters/xmp"),
      import("jszip").then((m) => m.default),
    ]);
    const xmpFiles = generateXMPBatch(inputs, options);
    const zip = new JSZip();
    for (const [filename, content] of xmpFiles) {
      zip.file(filename, content);
    }
    const blob = await zip.generateAsync({ type: "blob" });
    triggerDownload(blob, `${filmLabel}_xmp.zip`);
  } else if (format === "csv") {
    const { generateCSV } = await import("@/lib/exporters/csv");
    const csv = generateCSV(inputs, options);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    triggerDownload(blob, `${filmLabel}_exiftool.csv`);
  } else if (format === "script") {
    const { generateShellScript, generateBatchScript } = await import(
      "@/lib/exporters/exiftool-script"
    );
    const [JSZip] = await Promise.all([
      import("jszip").then((m) => m.default),
    ]);
    const sh = generateShellScript(inputs, options);
    const bat = generateBatchScript(inputs, options);
    const zip = new JSZip();
    zip.file("export.sh", sh);
    zip.file("export.bat", bat);
    const blob = await zip.generateAsync({ type: "blob" });
    triggerDownload(blob, `${filmLabel}_exiftool.zip`);
  } else if (format === "json") {
    const { generateJSON } = await import("@/lib/exporters/json");
    const json = generateJSON(inputs, options);
    const blob = new Blob([json], { type: "application/json;charset=utf-8" });
    triggerDownload(blob, `${filmLabel}_export.json`);
  }
}

export function ExportDialog({
  rollId,
  frameCount,
  format,
  open,
  onOpenChange,
}: ExportDialogProps) {
  const t = useTranslations("export");

  const [mode, setMode] = useState<"pattern" | "list">("pattern");
  const [pattern, setPattern] = useState("scan_{frame_number}.tif");
  const [fileList, setFileList] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);

  const fileListLines = fileList
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);
  const fileListValid = fileListLines.length === frameCount;

  const previewFilenames = resolveFilenames(
    mode,
    pattern,
    fileList,
    frameCount,
  ).slice(0, 3);

  const previewExtension = format === "xmp" ? ".xmp" : "";

  const handleDownload = useCallback(async () => {
    setIsGenerating(true);
    try {
      if (mode === "list" && !fileListValid) {
        toast.error(
          t("fileListMismatch", {
            expected: frameCount,
            actual: fileListLines.length,
          }),
        );
        return;
      }

      const { inputs, options, filmLabel } = await fetchExportData(
        rollId,
        mode,
        pattern,
        fileList,
      );

      await generateAndDownload(format, inputs, options, filmLabel);

      toast.success(t("success"));
      onOpenChange(false);
    } catch (error) {
      if (error instanceof Error && error.message === "NO_FRAMES") {
        toast.error(t("noFrames"));
      } else {
        console.error("Export failed:", error);
        toast.error(t("error"));
      }
    } finally {
      setIsGenerating(false);
    }
  }, [
    rollId,
    format,
    mode,
    pattern,
    fileList,
    frameCount,
    fileListLines.length,
    fileListValid,
    onOpenChange,
    t,
  ]);

  return (
    <Dialog open={open} onOpenChange={isGenerating ? undefined : onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t(FORMAT_TITLES[format])}</DialogTitle>
          <DialogDescription>{t("patternHint")}</DialogDescription>
        </DialogHeader>

        <Tabs
          value={mode}
          onValueChange={(v) => setMode(v as "pattern" | "list")}
        >
          <TabsList className="w-full">
            <TabsTrigger value="pattern">{t("filenamePattern")}</TabsTrigger>
            <TabsTrigger value="list">{t("fileList")}</TabsTrigger>
          </TabsList>

          <TabsContent value="pattern" className="space-y-3 pt-3">
            <div className="space-y-2">
              <Label htmlFor="export-pattern">{t("filenamePattern")}</Label>
              <Input
                id="export-pattern"
                value={pattern}
                onChange={(e) => setPattern(e.target.value)}
                placeholder="scan_{frame_number}.tif"
              />
            </div>
          </TabsContent>

          <TabsContent value="list" className="space-y-3 pt-3">
            <div className="space-y-2">
              <Label htmlFor="export-filelist">{t("fileList")}</Label>
              <Textarea
                id="export-filelist"
                value={fileList}
                onChange={(e) => setFileList(e.target.value)}
                placeholder={`scan_001.tif\nscan_002.tif\nscan_003.tif`}
                rows={6}
                aria-describedby="filelist-hint"
              />
              <p
                id="filelist-hint"
                className={`text-xs ${
                  fileList && !fileListValid
                    ? "text-destructive"
                    : "text-muted-foreground"
                }`}
              >
                {fileList && !fileListValid
                  ? t("fileListMismatch", {
                      expected: frameCount,
                      actual: fileListLines.length,
                    })
                  : t("fileListHint", { count: frameCount })}
              </p>
            </div>
          </TabsContent>
        </Tabs>

        {previewFilenames.length > 0 && (
          <div className="space-y-1">
            <p className="text-xs font-medium text-muted-foreground">
              {t("preview")}
            </p>
            <div className="rounded-md bg-muted p-2 font-mono text-xs">
              {previewFilenames.map((name, i) => (
                <div key={i} className="truncate">
                  {previewExtension
                    ? name.replace(/\.[^.]+$/, previewExtension)
                    : name}
                </div>
              ))}
              {frameCount > 3 && (
                <div className="text-muted-foreground">
                  ...{frameCount - 3} more
                </div>
              )}
            </div>
          </div>
        )}

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isGenerating}
          >
            {t("cancel")}
          </Button>
          <Button
            onClick={handleDownload}
            disabled={isGenerating || (mode === "list" && !fileListValid)}
          >
            {isGenerating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {t("generating")}
              </>
            ) : (
              t("download")
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/**
 * @deprecated Use ExportDialog instead. Kept for backwards compatibility.
 */
export const XMPExportDialog = (
  props: Omit<ExportDialogProps, "format">,
) => <ExportDialog {...props} format="xmp" />;
