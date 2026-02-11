/**
 * Pure utility functions for zoom/prime lens formatting and detection.
 */

interface LensLike {
  focal_length: number;
  max_aperture: number;
  focal_length_max?: number | null;
  min_aperture?: number | null;
}

/** Returns true if the lens has a focal_length_max (zoom lens). */
export function isZoomLens(lens: LensLike): boolean {
  return lens.focal_length_max != null;
}

/** Format focal length: "35-135mm" for zooms, "50mm" for primes. */
export function formatFocalLength(lens: LensLike): string {
  if (isZoomLens(lens)) {
    return `${lens.focal_length}-${lens.focal_length_max}mm`;
  }
  return `${lens.focal_length}mm`;
}

/** Format aperture: "f/3.5-4.5" for variable zooms, "f/1.4" otherwise. */
export function formatAperture(lens: LensLike): string {
  if (lens.min_aperture != null) {
    return `f/${lens.max_aperture}-${lens.min_aperture}`;
  }
  return `f/${lens.max_aperture}`;
}

/** Format full lens spec: "35-135mm f/3.5-4.5" or "50mm f/1.4". */
export function formatLensSpec(lens: LensLike): string {
  return `${formatFocalLength(lens)} ${formatAperture(lens)}`;
}

/** Default focal length for a frame: middle of range for zooms, focal_length for primes. */
export function defaultFrameFocalLength(lens: LensLike): number {
  if (isZoomLens(lens)) {
    return Math.round((lens.focal_length + lens.focal_length_max!) / 2);
  }
  return lens.focal_length;
}
