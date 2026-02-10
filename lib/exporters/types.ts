/**
 * Shared types for all export formats (XMP, CSV, ExifTool, JSON).
 *
 * These interfaces decouple exporters from the Dexie entity types,
 * so the pure generator functions stay free of database dependencies.
 */

export interface ExportFrameData {
  frameNumber: number;
  shutterSpeed: string;
  aperture: number;
  focalLength: number | null;
  latitude: number | null | undefined;
  longitude: number | null | undefined;
  locationName: string | null | undefined;
  notes: string | null | undefined;
  capturedAt: number; // Unix ms
}

export interface ExportRollData {
  id: string;
  ei: number;
  pushPull: number;
  status: string;
  frameCount: number;
  startDate: number;
  finishDate: number | null | undefined;
  developDate: number | null | undefined;
  scanDate: number | null | undefined;
  labName: string | null | undefined;
  devNotes: string | null | undefined;
  notes: string | null | undefined;
}

export interface ExportCameraData {
  make: string;
  name: string;
  format: string;
}

export interface ExportLensData {
  name: string;
  make: string;
  focalLength: number;
  maxAperture: number;
}

export interface ExportFilmData {
  brand: string;
  name: string;
  iso: number;
  process?: string;
}

export interface ExportInput {
  frame: ExportFrameData;
  roll: ExportRollData;
  camera: ExportCameraData;
  lens: ExportLensData | null;
  film: ExportFilmData;
  filename: string;
}

export interface ExportOptions {
  creatorName?: string | null;
  copyright?: string | null;
}

/**
 * Full-context JSON export shape (includes all related entities).
 */
export interface JSONExportData {
  exportedAt: string;
  generator: string;
  roll: ExportRollData;
  camera: ExportCameraData;
  film: ExportFilmData;
  lenses: ExportLensData[];
  frames: (ExportFrameData & { lensName: string | null; filename: string })[];
  options: ExportOptions;
}
