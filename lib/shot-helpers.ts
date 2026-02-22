import type { Frame, RollStatus } from "./types";

/**
 * Auto-fill defaults from the last frame.
 * Copies exposure settings but NOT notes (user should enter fresh notes each time).
 */
export function getAutoFillDefaults(frame: Frame): {
  shutter_speed: string | null;
  aperture: number | null;
  lens_id: string | null | undefined;
  metering_mode: string | null | undefined;
  exposure_comp: number | null | undefined;
  filter: string | null | undefined;
} {
  return {
    shutter_speed: frame.shutter_speed,
    aperture: frame.aperture,
    lens_id: frame.lens_id,
    metering_mode: frame.metering_mode,
    exposure_comp: frame.exposure_comp,
    filter: frame.filter,
  };
}

/**
 * Returns true if logging the next frame would exceed the roll's frame count.
 */
export function shouldWarnExceedFrameCount(
  nextFrameNumber: number,
  frameCount: number,
): boolean {
  return nextFrameNumber > frameCount;
}

/**
 * Returns true if frames can be logged for the given roll status.
 * Only "loaded" and "active" rolls accept new frames.
 */
export function canLogFrame(status: RollStatus): boolean {
  return status === "loaded" || status === "active";
}

/**
 * Computes the next frame number from existing frames.
 * Uses max(frame_numbers) + 1 to handle gaps from skipped frames.
 */
export function computeNextFrameNumber(frames: Frame[]): number {
  if (frames.length === 0) return 1;
  return Math.max(...frames.map((f) => f.frame_number)) + 1;
}

/**
 * Factory for blank frame records. Sets is_blank: true with null exposure data.
 */
export function createBlankFrame(
  rollId: string,
  frameNumber: number,
): Omit<Frame, "id"> {
  const now = Date.now();
  return {
    roll_id: rollId,
    frame_number: frameNumber,
    is_blank: true,
    shutter_speed: null,
    aperture: null,
    lens_id: null,
    metering_mode: null,
    exposure_comp: null,
    filter: null,
    focal_length: null,
    latitude: null,
    longitude: null,
    location_name: null,
    notes: null,
    thumbnail: null,
    image_url: null,
    captured_at: now,
    deleted_at: null,
    updated_at: now,
    created_at: now,
  };
}

/**
 * Validates the "skip to" target frame number.
 */
export function validateSkipTo(
  target: number,
  current: number,
  frameCount: number,
): { valid: boolean; error?: string } {
  if (!Number.isInteger(target) || target < 1) {
    return { valid: false, error: "invalidFrameNumber" };
  }
  if (target <= current) {
    return { valid: false, error: "skipToMustBeGreater" };
  }
  const maxAllowed = Math.max(frameCount * 2, 100);
  if (target > maxAllowed) {
    return { valid: false, error: "skipToExceedsMax" };
  }
  return { valid: true };
}
