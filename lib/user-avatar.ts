/**
 * Deterministic avatar system.
 * Assigns a Lucide icon (Camera, Aperture, or Film) and a Wes Anderson-inspired
 * pastel background color based on a hash of the user's ID.
 */

export type AvatarIcon = "camera" | "aperture" | "film";

export interface UserAvatar {
  icon: AvatarIcon;
  /** Tailwind bg class for the avatar circle */
  bgColor: string;
  /** Tailwind text class for the icon (contrasts with bgColor) */
  iconColor: string;
}

const ICONS: AvatarIcon[] = ["camera", "aperture", "film"];

/**
 * Wes Anderson-inspired pastel palette.
 * Each entry pairs a background with a contrasting icon color.
 */
const PALETTE: { bg: string; icon: string }[] = [
  { bg: "bg-[#F2B5A7]", icon: "text-[#6B2A1A]" }, // dusty rose
  { bg: "bg-[#F7D6A0]", icon: "text-[#6B4513]" }, // warm sand
  { bg: "bg-[#A8D5BA]", icon: "text-[#1B4332]" }, // sage green
  { bg: "bg-[#B8D4E3]", icon: "text-[#1B3A4B]" }, // powder blue
  { bg: "bg-[#D4B8E0]", icon: "text-[#3B1F52]" }, // soft lavender
  { bg: "bg-[#F5C6AA]", icon: "text-[#5C3011]" }, // peach
  { bg: "bg-[#C9E4CA]", icon: "text-[#1E4620]" }, // mint
  { bg: "bg-[#E8C5C5]", icon: "text-[#5C1A1A]" }, // blush
];

/** Simple string hash that returns a positive integer. */
function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash * 31 + str.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
}

/**
 * Returns a deterministic avatar (icon + colors) for the given user ID.
 */
export function getUserAvatar(userId: string): UserAvatar {
  const hash = hashString(userId);
  const iconIndex = hash % ICONS.length;
  const colorIndex = hash % PALETTE.length;
  const palette = PALETTE[colorIndex];

  return {
    icon: ICONS[iconIndex],
    bgColor: palette.bg,
    iconColor: palette.icon,
  };
}
