import type { Frame, RollStatus } from "./types";

/**
 * Auto-fill defaults from the last frame.
 * Copies exposure settings but NOT notes (user should enter fresh notes each time).
 */
export function getAutoFillDefaults(frame: Frame): {
  shutter_speed: string;
  aperture: number;
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
