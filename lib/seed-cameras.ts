import type { CameraStock } from "./types";
import type { FilmFormat, LensMount, CameraType } from "./constants";

function cam(
  id: string,
  make: string,
  name: string,
  mount: LensMount,
  format: FilmFormat,
  defaultFrameCount: number,
  type: CameraType,
): CameraStock {
  return { id, make, name, mount, format, default_frame_count: defaultFrameCount, type };
}

/**
 * Comprehensive camera stock catalog — ~140 cameras.
 * Read-only seed data populated into Dexie `cameraStock` table.
 */
export const cameraStocks: CameraStock[] = [
  // ---------------------------------------------------------------------------
  // Nikon — SLR (F-mount)
  // ---------------------------------------------------------------------------
  cam("nikon-fm", "Nikon", "FM", "Nikon F", "35mm", 36, "slr"),
  cam("nikon-fm2", "Nikon", "FM2", "Nikon F", "35mm", 36, "slr"),
  cam("nikon-fm3a", "Nikon", "FM3A", "Nikon F", "35mm", 36, "slr"),
  cam("nikon-fe", "Nikon", "FE", "Nikon F", "35mm", 36, "slr"),
  cam("nikon-fe2", "Nikon", "FE2", "Nikon F", "35mm", 36, "slr"),
  cam("nikon-f2", "Nikon", "F2", "Nikon F", "35mm", 36, "slr"),
  cam("nikon-f3", "Nikon", "F3", "Nikon F", "35mm", 36, "slr"),
  cam("nikon-f4", "Nikon", "F4", "Nikon F", "35mm", 36, "slr"),
  cam("nikon-f5", "Nikon", "F5", "Nikon F", "35mm", 36, "slr"),
  cam("nikon-f6", "Nikon", "F6", "Nikon F", "35mm", 36, "slr"),
  cam("nikon-f100", "Nikon", "F100", "Nikon F", "35mm", 36, "slr"),
  cam("nikon-f80", "Nikon", "F80", "Nikon F", "35mm", 36, "slr"),

  // ---------------------------------------------------------------------------
  // Canon — FD SLR
  // ---------------------------------------------------------------------------
  cam("canon-ae1", "Canon", "AE-1", "Canon FD", "35mm", 36, "slr"),
  cam("canon-ae1p", "Canon", "AE-1 Program", "Canon FD", "35mm", 36, "slr"),
  cam("canon-a1", "Canon", "A-1", "Canon FD", "35mm", 36, "slr"),
  cam("canon-f1", "Canon", "F-1", "Canon FD", "35mm", 36, "slr"),
  cam("canon-f1n", "Canon", "New F-1", "Canon FD", "35mm", 36, "slr"),

  // ---------------------------------------------------------------------------
  // Canon — EF SLR
  // ---------------------------------------------------------------------------
  cam("canon-eos1v", "Canon", "EOS-1V", "Canon EF", "35mm", 36, "slr"),
  cam("canon-eos3", "Canon", "EOS 3", "Canon EF", "35mm", 36, "slr"),
  cam("canon-eos5", "Canon", "EOS 5", "Canon EF", "35mm", 36, "slr"),
  cam("canon-eos1n", "Canon", "EOS-1N", "Canon EF", "35mm", 36, "slr"),

  // ---------------------------------------------------------------------------
  // Pentax — 35mm SLR
  // ---------------------------------------------------------------------------
  cam("pentax-k1000", "Pentax", "K1000", "Pentax K", "35mm", 36, "slr"),
  cam("pentax-mx", "Pentax", "MX", "Pentax K", "35mm", 36, "slr"),
  cam("pentax-me-super", "Pentax", "ME Super", "Pentax K", "35mm", 36, "slr"),
  cam("pentax-lx", "Pentax", "LX", "Pentax K", "35mm", 36, "slr"),
  cam("pentax-spotmatic", "Pentax", "Spotmatic", "M42", "35mm", 36, "slr"),

  // ---------------------------------------------------------------------------
  // Pentax — Medium Format
  // ---------------------------------------------------------------------------
  cam("pentax-67", "Pentax", "67", "Pentax 67", "120", 10, "medium-format-slr"),
  cam("pentax-67ii", "Pentax", "67II", "Pentax 67", "120", 10, "medium-format-slr"),
  cam("pentax-645", "Pentax", "645", "Pentax 645", "120", 15, "medium-format-slr"),
  cam("pentax-645n", "Pentax", "645N", "Pentax 645", "120", 15, "medium-format-slr"),
  cam("pentax-645nii", "Pentax", "645NII", "Pentax 645", "120", 15, "medium-format-slr"),

  // ---------------------------------------------------------------------------
  // Olympus — OM SLR
  // ---------------------------------------------------------------------------
  cam("olympus-om1", "Olympus", "OM-1", "Olympus OM", "35mm", 36, "slr"),
  cam("olympus-om2", "Olympus", "OM-2", "Olympus OM", "35mm", 36, "slr"),
  cam("olympus-om2n", "Olympus", "OM-2n", "Olympus OM", "35mm", 36, "slr"),
  cam("olympus-om3ti", "Olympus", "OM-3Ti", "Olympus OM", "35mm", 36, "slr"),
  cam("olympus-om4ti", "Olympus", "OM-4Ti", "Olympus OM", "35mm", 36, "slr"),
  cam("olympus-om10", "Olympus", "OM-10", "Olympus OM", "35mm", 36, "slr"),

  // ---------------------------------------------------------------------------
  // Olympus — Compact
  // ---------------------------------------------------------------------------
  cam("olympus-xa", "Olympus", "XA", "fixed", "35mm", 36, "rangefinder"),
  cam("olympus-xa2", "Olympus", "XA2", "fixed", "35mm", 36, "point-and-shoot"),
  cam("olympus-mju-ii", "Olympus", "mju-II (Stylus Epic)", "fixed", "35mm", 36, "point-and-shoot"),
  cam("olympus-mju-i", "Olympus", "mju-I", "fixed", "35mm", 36, "point-and-shoot"),

  // ---------------------------------------------------------------------------
  // Minolta — SLR
  // ---------------------------------------------------------------------------
  cam("minolta-x700", "Minolta", "X-700", "Minolta MD/MC", "35mm", 36, "slr"),
  cam("minolta-xd7", "Minolta", "XD-7", "Minolta MD/MC", "35mm", 36, "slr"),
  cam("minolta-srt101", "Minolta", "SRT 101", "Minolta MD/MC", "35mm", 36, "slr"),
  cam("minolta-xg-m", "Minolta", "XG-M", "Minolta MD/MC", "35mm", 36, "slr"),

  // ---------------------------------------------------------------------------
  // Minolta — Rangefinder
  // ---------------------------------------------------------------------------
  cam("minolta-cle", "Minolta", "CLE", "Leica M", "35mm", 36, "rangefinder"),

  // ---------------------------------------------------------------------------
  // Leica — M Rangefinder
  // ---------------------------------------------------------------------------
  cam("leica-m2", "Leica", "M2", "Leica M", "35mm", 36, "rangefinder"),
  cam("leica-m3", "Leica", "M3", "Leica M", "35mm", 36, "rangefinder"),
  cam("leica-m4", "Leica", "M4", "Leica M", "35mm", 36, "rangefinder"),
  cam("leica-m4p", "Leica", "M4-P", "Leica M", "35mm", 36, "rangefinder"),
  cam("leica-m6", "Leica", "M6", "Leica M", "35mm", 36, "rangefinder"),
  cam("leica-m6ttl", "Leica", "M6 TTL", "Leica M", "35mm", 36, "rangefinder"),
  cam("leica-m7", "Leica", "M7", "Leica M", "35mm", 36, "rangefinder"),
  cam("leica-mp", "Leica", "MP", "Leica M", "35mm", 36, "rangefinder"),
  cam("leica-ma", "Leica", "M-A", "Leica M", "35mm", 36, "rangefinder"),

  // ---------------------------------------------------------------------------
  // Leica — R SLR
  // ---------------------------------------------------------------------------
  cam("leica-r6", "Leica", "R6", "Leica R", "35mm", 36, "slr"),
  cam("leica-r6-2", "Leica", "R6.2", "Leica R", "35mm", 36, "slr"),
  cam("leica-r8", "Leica", "R8", "Leica R", "35mm", 36, "slr"),

  // ---------------------------------------------------------------------------
  // Contax — SLR (C/Y mount)
  // ---------------------------------------------------------------------------
  cam("contax-rtsiii", "Contax", "RTS III", "Contax/Yashica", "35mm", 36, "slr"),
  cam("contax-aria", "Contax", "Aria", "Contax/Yashica", "35mm", 36, "slr"),
  cam("contax-139", "Contax", "139 Quartz", "Contax/Yashica", "35mm", 36, "slr"),
  cam("contax-167mt", "Contax", "167MT", "Contax/Yashica", "35mm", 36, "slr"),
  cam("contax-s2", "Contax", "S2", "Contax/Yashica", "35mm", 36, "slr"),

  // ---------------------------------------------------------------------------
  // Contax — Rangefinder / Compact
  // ---------------------------------------------------------------------------
  cam("contax-g1", "Contax", "G1", "Contax G", "35mm", 36, "rangefinder"),
  cam("contax-g2", "Contax", "G2", "Contax G", "35mm", 36, "rangefinder"),
  cam("contax-t2", "Contax", "T2", "fixed", "35mm", 36, "point-and-shoot"),
  cam("contax-t3", "Contax", "T3", "fixed", "35mm", 36, "point-and-shoot"),
  cam("contax-tvs", "Contax", "TVS", "fixed", "35mm", 36, "point-and-shoot"),

  // ---------------------------------------------------------------------------
  // Hasselblad — Medium Format
  // ---------------------------------------------------------------------------
  cam("hasselblad-500cm", "Hasselblad", "500C/M", "Hasselblad V", "120", 12, "medium-format-slr"),
  cam("hasselblad-501cm", "Hasselblad", "501CM", "Hasselblad V", "120", 12, "medium-format-slr"),
  cam("hasselblad-503cw", "Hasselblad", "503CW", "Hasselblad V", "120", 12, "medium-format-slr"),
  cam("hasselblad-swc", "Hasselblad", "SWC", "Hasselblad V", "120", 12, "rangefinder"),

  // ---------------------------------------------------------------------------
  // Mamiya — Medium Format
  // ---------------------------------------------------------------------------
  cam("mamiya-rb67", "Mamiya", "RB67", "Mamiya RB/RZ67", "120", 10, "medium-format-slr"),
  cam("mamiya-rz67", "Mamiya", "RZ67", "Mamiya RB/RZ67", "120", 10, "medium-format-slr"),
  cam("mamiya-rz67ii", "Mamiya", "RZ67 Pro II", "Mamiya RB/RZ67", "120", 10, "medium-format-slr"),
  cam("mamiya-645", "Mamiya", "645", "Mamiya 645", "120", 15, "medium-format-slr"),
  cam("mamiya-645-pro", "Mamiya", "645 Pro", "Mamiya 645", "120", 15, "medium-format-slr"),
  cam("mamiya-645-protl", "Mamiya", "645 Pro TL", "Mamiya 645", "120", 15, "medium-format-slr"),
  cam("mamiya-7", "Mamiya", "7", "Mamiya 7", "120", 10, "rangefinder"),
  cam("mamiya-7ii", "Mamiya", "7II", "Mamiya 7", "120", 10, "rangefinder"),
  cam("mamiya-c330", "Mamiya", "C330", "fixed", "120", 12, "tlr"),
  cam("mamiya-c220", "Mamiya", "C220", "fixed", "120", 12, "tlr"),

  // ---------------------------------------------------------------------------
  // Rolleiflex — TLR
  // ---------------------------------------------------------------------------
  cam("rolleiflex-28f", "Rolleiflex", "2.8F", "fixed", "120", 12, "tlr"),
  cam("rolleiflex-35f", "Rolleiflex", "3.5F", "fixed", "120", 12, "tlr"),
  cam("rolleiflex-28gx", "Rolleiflex", "2.8GX", "fixed", "120", 12, "tlr"),

  // ---------------------------------------------------------------------------
  // Fuji — Medium Format
  // ---------------------------------------------------------------------------
  cam("fuji-gw690iii", "Fujifilm", "GW690III", "fixed", "120", 8, "rangefinder"),
  cam("fuji-gsw690iii", "Fujifilm", "GSW690III", "fixed", "120", 8, "rangefinder"),
  cam("fuji-ga645", "Fujifilm", "GA645", "fixed", "120", 15, "rangefinder"),
  cam("fuji-gf670", "Fujifilm", "GF670", "fixed", "120", 12, "rangefinder"),

  // ---------------------------------------------------------------------------
  // Fuji — 35mm Compact
  // ---------------------------------------------------------------------------
  cam("fuji-klasse-w", "Fujifilm", "Klasse W", "fixed", "35mm", 36, "point-and-shoot"),
  cam("fuji-klasse-s", "Fujifilm", "Klasse S", "fixed", "35mm", 36, "point-and-shoot"),
  cam("fuji-natura-s", "Fujifilm", "Natura S", "fixed", "35mm", 36, "point-and-shoot"),
  cam("fuji-tiara", "Fujifilm", "Tiara", "fixed", "35mm", 36, "point-and-shoot"),

  // ---------------------------------------------------------------------------
  // Bronica — Medium Format
  // ---------------------------------------------------------------------------
  cam("bronica-sq-a", "Bronica", "SQ-A", "fixed", "120", 12, "medium-format-slr"),
  cam("bronica-sq-ai", "Bronica", "SQ-Ai", "fixed", "120", 12, "medium-format-slr"),
  cam("bronica-etrsi", "Bronica", "ETRSi", "fixed", "120", 15, "medium-format-slr"),
  cam("bronica-gs1", "Bronica", "GS-1", "fixed", "120", 10, "medium-format-slr"),
  cam("bronica-rf645", "Bronica", "RF645", "fixed", "120", 15, "rangefinder"),

  // ---------------------------------------------------------------------------
  // Yashica
  // ---------------------------------------------------------------------------
  cam("yashica-mat124g", "Yashica", "Mat-124G", "fixed", "120", 12, "tlr"),
  cam("yashica-t4", "Yashica", "T4", "fixed", "35mm", 36, "point-and-shoot"),
  cam("yashica-t5", "Yashica", "T5", "fixed", "35mm", 36, "point-and-shoot"),
  cam("yashica-electro35", "Yashica", "Electro 35", "fixed", "35mm", 36, "rangefinder"),
  cam("yashica-electro35gsn", "Yashica", "Electro 35 GSN", "fixed", "35mm", 36, "rangefinder"),

  // ---------------------------------------------------------------------------
  // Voigtlander — Rangefinder
  // ---------------------------------------------------------------------------
  cam("voigtlander-bessa-r", "Voigtlander", "Bessa R", "Leica M", "35mm", 36, "rangefinder"),
  cam("voigtlander-bessa-r2", "Voigtlander", "Bessa R2", "Leica M", "35mm", 36, "rangefinder"),
  cam("voigtlander-bessa-r3a", "Voigtlander", "Bessa R3A", "Leica M", "35mm", 36, "rangefinder"),
  cam("voigtlander-bessa-r2a", "Voigtlander", "Bessa R2A", "Leica M", "35mm", 36, "rangefinder"),

  // ---------------------------------------------------------------------------
  // Ricoh — Compact
  // ---------------------------------------------------------------------------
  cam("ricoh-gr1", "Ricoh", "GR1", "fixed", "35mm", 36, "point-and-shoot"),
  cam("ricoh-gr1s", "Ricoh", "GR1s", "fixed", "35mm", 36, "point-and-shoot"),
  cam("ricoh-gr1v", "Ricoh", "GR1v", "fixed", "35mm", 36, "point-and-shoot"),

  // ---------------------------------------------------------------------------
  // Konica
  // ---------------------------------------------------------------------------
  cam("konica-hexar-af", "Konica", "Hexar AF", "fixed", "35mm", 36, "rangefinder"),
  cam("konica-hexar-rf", "Konica", "Hexar RF", "Leica M", "35mm", 36, "rangefinder"),
  cam("konica-big-mini", "Konica", "Big Mini", "fixed", "35mm", 36, "point-and-shoot"),

  // ---------------------------------------------------------------------------
  // Lomo / Lomography
  // ---------------------------------------------------------------------------
  cam("lomo-lca", "Lomography", "LC-A", "fixed", "35mm", 36, "point-and-shoot"),
  cam("lomo-lca-plus", "Lomography", "LC-A+", "fixed", "35mm", 36, "point-and-shoot"),
  cam("holga-120n", "Holga", "120N", "fixed", "120", 12, "other"),

  // ---------------------------------------------------------------------------
  // Nikon — Point & Shoot
  // ---------------------------------------------------------------------------
  cam("nikon-35ti", "Nikon", "35Ti", "fixed", "35mm", 36, "point-and-shoot"),
  cam("nikon-28ti", "Nikon", "28Ti", "fixed", "35mm", 36, "point-and-shoot"),
  cam("nikon-l35af", "Nikon", "L35AF", "fixed", "35mm", 36, "point-and-shoot"),

  // ---------------------------------------------------------------------------
  // Canon — Point & Shoot
  // ---------------------------------------------------------------------------
  cam("canon-sureshot-af35m", "Canon", "Sure Shot AF35M", "fixed", "35mm", 36, "point-and-shoot"),
  cam("canon-wp-1", "Canon", "WP-1", "fixed", "35mm", 36, "point-and-shoot"),

  // ---------------------------------------------------------------------------
  // Minox
  // ---------------------------------------------------------------------------
  cam("minox-35gt", "Minox", "35 GT", "fixed", "35mm", 36, "point-and-shoot"),

  // ---------------------------------------------------------------------------
  // Polaroid — Instant
  // ---------------------------------------------------------------------------
  cam("polaroid-sx70", "Polaroid", "SX-70", "fixed", "instant", 8, "slr"),
  cam("polaroid-sx70-sonar", "Polaroid", "SX-70 Sonar", "fixed", "instant", 8, "slr"),
  cam("polaroid-600", "Polaroid", "OneStep 600", "fixed", "instant", 8, "point-and-shoot"),
  cam("polaroid-now", "Polaroid", "Now", "fixed", "instant", 8, "point-and-shoot"),
  cam("polaroid-now-plus", "Polaroid", "Now+", "fixed", "instant", 8, "point-and-shoot"),
  cam("polaroid-go", "Polaroid", "Go", "fixed", "instant", 8, "point-and-shoot"),

  // ---------------------------------------------------------------------------
  // Fujifilm — Instax
  // ---------------------------------------------------------------------------
  cam("fuji-instax-mini-90", "Fujifilm", "Instax Mini 90", "fixed", "instant", 10, "point-and-shoot"),
  cam("fuji-instax-mini-evo", "Fujifilm", "Instax Mini Evo", "fixed", "instant", 10, "point-and-shoot"),
  cam("fuji-instax-wide-300", "Fujifilm", "Instax Wide 300", "fixed", "instant", 10, "point-and-shoot"),
  cam("fuji-instax-sq6", "Fujifilm", "Instax Square SQ6", "fixed", "instant", 10, "point-and-shoot"),

  // ---------------------------------------------------------------------------
  // Large Format — View Cameras
  // ---------------------------------------------------------------------------
  cam("toyo-45a", "Toyo", "45A", "other", "4x5", 1, "view"),
  cam("toyo-45aii", "Toyo", "45AII", "other", "4x5", 1, "view"),
  cam("sinar-f2", "Sinar", "F2", "other", "4x5", 1, "view"),
  cam("linhof-technika", "Linhof", "Master Technika", "other", "4x5", 1, "view"),
  cam("intrepid-4x5-mk4", "Intrepid", "4x5 Mk4", "other", "4x5", 1, "view"),
  cam("chamonix-045n2", "Chamonix", "045N-2", "other", "4x5", 1, "view"),
  cam("wista-45d", "Wista", "45D", "other", "4x5", 1, "view"),

  // ---------------------------------------------------------------------------
  // Kiev / Zorki — Soviet rangefinders
  // ---------------------------------------------------------------------------
  cam("zorki-4", "Zorki", "4", "M42", "35mm", 36, "rangefinder"),
  cam("kiev-4", "Kiev", "4", "Contax/Yashica", "35mm", 36, "rangefinder"),
  cam("kiev-60", "Kiev", "60", "Pentax 67", "120", 12, "medium-format-slr"),
  cam("kiev-88", "Kiev", "88", "Hasselblad V", "120", 12, "medium-format-slr"),
];

/** Populate the cameraStock table with seed data (idempotent via bulkPut) */
export async function seedCameraStocks(
  table: { bulkPut: (items: CameraStock[]) => Promise<unknown> },
): Promise<void> {
  await table.bulkPut(cameraStocks);
}
