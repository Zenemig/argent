/**
 * Convert decimal GPS coordinates to XMP-compliant DMS format.
 * XMP uses "DD,MM.MMM[N|S|E|W]" format for GPS coordinates.
 */

export interface GPSPair {
  latitude: string;
  latitudeRef: string;
  longitude: string;
  longitudeRef: string;
}

/**
 * Convert a decimal coordinate to XMP GPS string format: "DD,MM.MMMM"
 * and its directional reference (N/S for latitude, E/W for longitude).
 */
export function decimalToXMPGPS(
  decimal: number,
  isLatitude: boolean,
): { value: string; ref: string } {
  const ref = isLatitude
    ? decimal >= 0 ? "N" : "S"
    : decimal >= 0 ? "E" : "W";

  const abs = Math.abs(decimal);
  const degrees = Math.floor(abs);
  const minutes = (abs - degrees) * 60;

  return {
    value: `${degrees},${minutes.toFixed(4)}`,
    ref,
  };
}

/**
 * Convert a lat/lon pair to XMP-compatible GPS strings.
 * Returns null if either coordinate is null/undefined.
 */
export function convertGPSPair(
  latitude: number | null | undefined,
  longitude: number | null | undefined,
): GPSPair | null {
  if (latitude == null || longitude == null) return null;

  const lat = decimalToXMPGPS(latitude, true);
  const lon = decimalToXMPGPS(longitude, false);

  return {
    latitude: lat.value,
    latitudeRef: lat.ref,
    longitude: lon.value,
    longitudeRef: lon.ref,
  };
}
