import {
  SHUTTER_SPEEDS,
  APERTURES,
  METERING_MODES,
  type ShutterSpeed,
  type MeteringMode,
} from "./constants";

/** Timed shutter speeds (everything except "B") */
const TIMED_SPEEDS = SHUTTER_SPEEDS.filter((s): s is Exclude<ShutterSpeed, "B"> => s !== "B");

/**
 * Filter SHUTTER_SPEEDS to the range [min, max] (inclusive) of timed speeds,
 * with Bulb handled separately as a boolean.
 *
 * - `min`/`max`: slowest/fastest timed speed (e.g. "1s", "1/4000"). Null = no limit.
 * - `hasBulb`: whether to include "B". Null/undefined = include (unconstrained).
 *
 * Returns the full array if all params are nullish.
 */
export function filterShutterSpeeds(
  min: ShutterSpeed | null | undefined,
  max: ShutterSpeed | null | undefined,
  hasBulb: boolean | null | undefined,
): readonly ShutterSpeed[] {
  // Unconstrained: return everything
  if (min == null && max == null && hasBulb == null) return [...SHUTTER_SPEEDS];

  // Filter timed speeds by range
  let timed: readonly ShutterSpeed[];
  if (min == null && max == null) {
    timed = [...TIMED_SPEEDS];
  } else {
    const minIdx = min != null ? TIMED_SPEEDS.indexOf(min as typeof TIMED_SPEEDS[number]) : 0;
    const maxIdx = max != null ? TIMED_SPEEDS.indexOf(max as typeof TIMED_SPEEDS[number]) : TIMED_SPEEDS.length - 1;
    timed = TIMED_SPEEDS.slice(minIdx, maxIdx + 1);
  }

  // Prepend B if allowed (null = unconstrained = include)
  const includeB = hasBulb !== false;
  return includeB ? ["B" as ShutterSpeed, ...timed] : timed;
}

/**
 * Filter APERTURES between maxAperture (widest, smallest f-number)
 * and apertureMin (narrowest, largest f-number). Inclusive.
 * Returns the full array if both are nullish.
 */
export function filterApertures(
  maxAperture: number | null | undefined,
  apertureMin: number | null | undefined,
): readonly number[] {
  if (maxAperture == null && apertureMin == null) return [...APERTURES];

  return APERTURES.filter((a) => {
    if (maxAperture != null && a < maxAperture) return false;
    if (apertureMin != null && a > apertureMin) return false;
    return true;
  });
}

/**
 * Filter METERING_MODES to only the allowed modes.
 * Returns the full array if allowed is nullish.
 * Preserves the canonical order from METERING_MODES.
 */
export function filterMeteringModes(
  allowed: readonly MeteringMode[] | null | undefined,
): readonly MeteringMode[] {
  if (allowed == null) return [...METERING_MODES];

  return METERING_MODES.filter((m) => allowed.includes(m));
}
