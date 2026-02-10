/**
 * Parse shutter speed strings into numeric values and XMP-compatible formats.
 *
 * Supported formats:
 * - Fractions: "1/125", "1/60", "1/2"
 * - Seconds: "1s", "2s", "30s"
 * - Bulb with duration: "B 4m", "B 30s", "B 2m30s"
 * - Bare bulb: "B" (no numeric duration)
 */

/**
 * Parse a shutter speed string to seconds (as a number).
 * Returns null for unparseable values or bare "B" (bulb without duration).
 */
export function parseShutterSpeed(speed: string): number | null {
  const trimmed = speed.trim();

  // Fraction: "1/125"
  const fractionMatch = trimmed.match(/^(\d+)\/(\d+)$/);
  if (fractionMatch) {
    const numerator = parseInt(fractionMatch[1], 10);
    const denominator = parseInt(fractionMatch[2], 10);
    if (denominator === 0) return null;
    return numerator / denominator;
  }

  // Seconds: "2s", "30s"
  const secondsMatch = trimmed.match(/^(\d+(?:\.\d+)?)s$/i);
  if (secondsMatch) {
    return parseFloat(secondsMatch[1]);
  }

  // Bulb with duration: "B 4m", "B 30s", "B 2m30s"
  if (trimmed.toUpperCase().startsWith("B")) {
    const bulbPart = trimmed.slice(1).trim();
    if (!bulbPart) return null; // Bare "B"

    const minuteMatch = bulbPart.match(/^(\d+)m(?:(\d+)s)?$/i);
    if (minuteMatch) {
      const minutes = parseInt(minuteMatch[1], 10);
      const seconds = minuteMatch[2] ? parseInt(minuteMatch[2], 10) : 0;
      return minutes * 60 + seconds;
    }

    const bulbSeconds = bulbPart.match(/^(\d+)s$/i);
    if (bulbSeconds) {
      return parseInt(bulbSeconds[1], 10);
    }

    return null;
  }

  return null;
}

/**
 * Format a shutter speed string for XMP ExposureTime.
 * Returns the rational notation (e.g., "1/125") or seconds as "N/1".
 * Returns null if unparseable.
 */
export function formatShutterForXMP(speed: string): string | null {
  const trimmed = speed.trim();

  // Already a fraction — pass through
  const fractionMatch = trimmed.match(/^(\d+)\/(\d+)$/);
  if (fractionMatch) return trimmed;

  const seconds = parseShutterSpeed(trimmed);
  if (seconds == null) return null;

  // Whole seconds: express as "N/1"
  if (Number.isInteger(seconds)) {
    return `${seconds}/1`;
  }

  // Sub-second: express as "1/N" where N is rounded
  if (seconds < 1) {
    const denominator = Math.round(1 / seconds);
    return `1/${denominator}`;
  }

  // Fractional seconds > 1 (unusual but possible): express as decimal
  return `${seconds}/1`;
}
