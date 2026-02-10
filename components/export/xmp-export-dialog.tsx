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
import type {
  XMPExportInput,
  XMPCameraData,
  XMPLensData,
  XMPFilmData,
  XMPRollData,
  XMPFrameData,
} from "@/lib/exporters/xmp";

interface XMPExportDialogProps {
  rollId: string;
  frameCount: number;
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

export function XMPExportDialog({
  rollId,
  frameCount,
  open,
  onOpenChange,
}: XMPExportDialogProps) {
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

  const handleDownload = useCallback(async () => {
    setIsGenerating(true);
    try {
      // Validate file list mode
      if (mode === "list" && !fileListValid) {
        toast.error(
          t("fileListMismatch", {
            expected: frameCount,
            actual: fileListLines.length,
          }),
        );
        return;
      }

      // Query data from Dexie
      const roll = await db.rolls.get(rollId);
      if (!roll) throw new Error("Roll not found");

      const frames = await db.frames
        .where("roll_id")
        .equals(rollId)
        .sortBy("frame_number");

      if (frames.length === 0) {
        toast.error(t("noFrames"));
        return;
      }

      const camera = await db.cameras.get(roll.camera_id);
      if (!camera) throw new Error("Camera not found");

      // Film: check custom first, then seed
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

      // User settings
      const displayName = await getSetting("displayName");
      const copyright = await getSetting("copyright");

      // Resolve filenames
      const filenames = resolveFilenames(
        mode,
        pattern,
        fileList,
        frames.length,
      );

      // Build export inputs
      const cameraData: XMPCameraData = {
        make: camera.make,
        name: camera.name,
      };
      const rollData: XMPRollData = { ei: roll.ei, pushPull: roll.push_pull };
      const filmData: XMPFilmData = {
        brand: filmSource.brand,
        name: filmSource.name,
        iso: filmSource.iso,
      };

      const inputs: XMPExportInput[] = frames.map((frame, i) => {
        const lensRecord =
          lensMap.get(frame.lens_id ?? "") ??
          lensMap.get(roll.lens_id ?? "") ??
          null;

        const lensData: XMPLensData | null = lensRecord
          ? {
              name: lensRecord.name,
              focalLength: lensRecord.focal_length,
            }
          : null;

        const frameData: XMPFrameData = {
          frameNumber: frame.frame_number,
          shutterSpeed: frame.shutter_speed,
          aperture: frame.aperture,
          focalLength: lensRecord?.focal_length ?? null,
          latitude: frame.latitude,
          longitude: frame.longitude,
          locationName: frame.location_name,
          notes: frame.notes,
          capturedAt: frame.captured_at,
        };

        return {
          frame: frameData,
          roll: rollData,
          camera: cameraData,
          lens: lensData,
          film: filmData,
          filename: filenames[i],
        };
      });

      // Dynamic imports for heavy modules
      const [{ generateXMPBatch }, JSZip] = await Promise.all([
        import("@/lib/exporters/xmp"),
        import("jszip").then((m) => m.default),
      ]);

      const xmpFiles = generateXMPBatch(inputs, {
        creatorName: displayName,
        copyright,
      });

      // Build ZIP
      const zip = new JSZip();
      for (const [filename, content] of xmpFiles) {
        zip.file(filename, content);
      }

      const blob = await zip.generateAsync({ type: "blob" });
      const zipName = `${filmSource.brand}_${filmSource.name}_xmp`.replace(
        /\s+/g,
        "_",
      );
      triggerDownload(blob, `${zipName}.zip`);

      toast.success(t("success"));
      onOpenChange(false);
    } catch (error) {
      console.error("XMP export failed:", error);
      toast.error(t("error"));
    } finally {
      setIsGenerating(false);
    }
  }, [
    rollId,
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
          <DialogTitle>{t("xmp")}</DialogTitle>
          <DialogDescription>
            {t("patternHint")}
          </DialogDescription>
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
              <Label htmlFor="xmp-pattern">{t("filenamePattern")}</Label>
              <Input
                id="xmp-pattern"
                value={pattern}
                onChange={(e) => setPattern(e.target.value)}
                placeholder="scan_{frame_number}.tif"
              />
            </div>
          </TabsContent>

          <TabsContent value="list" className="space-y-3 pt-3">
            <div className="space-y-2">
              <Label htmlFor="xmp-filelist">{t("fileList")}</Label>
              <Textarea
                id="xmp-filelist"
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
                  {name.replace(/\.[^.]+$/, ".xmp")}
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
            {t("cancel", { ns: "common" })}
          </Button>
          <Button
            onClick={handleDownload}
            disabled={
              isGenerating || (mode === "list" && !fileListValid)
            }
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
