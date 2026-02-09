import type { FilmStock } from "./types";
import type { FilmFormat, FilmProcess } from "./constants";

function stock(
  id: string,
  brand: string,
  name: string,
  iso: number,
  format: FilmFormat[],
  process: FilmProcess,
): FilmStock {
  return { id, brand, name, iso, format, process };
}

/**
 * Comprehensive film stock catalog — 80+ current stocks.
 * Read-only seed data populated into Dexie `filmStock` table.
 */
export const filmStocks: FilmStock[] = [
  // ---------------------------------------------------------------------------
  // Kodak
  // ---------------------------------------------------------------------------
  stock("kodak-portra-160", "Kodak", "Portra 160", 160, ["35mm", "120", "4x5"], "C-41"),
  stock("kodak-portra-400", "Kodak", "Portra 400", 400, ["35mm", "120", "4x5"], "C-41"),
  stock("kodak-portra-800", "Kodak", "Portra 800", 800, ["35mm", "120"], "C-41"),
  stock("kodak-ektar-100", "Kodak", "Ektar 100", 100, ["35mm", "120", "4x5"], "C-41"),
  stock("kodak-gold-200", "Kodak", "Gold 200", 200, ["35mm", "120"], "C-41"),
  stock("kodak-ultramax-400", "Kodak", "UltraMax 400", 400, ["35mm"], "C-41"),
  stock("kodak-colorplus-200", "Kodak", "ColorPlus 200", 200, ["35mm"], "C-41"),
  stock("kodak-trix-400", "Kodak", "Tri-X 400", 400, ["35mm", "120"], "BW"),
  stock("kodak-tmax-100", "Kodak", "T-MAX 100", 100, ["35mm", "120", "4x5"], "BW"),
  stock("kodak-tmax-400", "Kodak", "T-MAX 400", 400, ["35mm", "120"], "BW"),
  stock("kodak-tmax-p3200", "Kodak", "T-MAX P3200", 3200, ["35mm"], "BW"),
  stock("kodak-ektachrome-e100", "Kodak", "Ektachrome E100", 100, ["35mm", "120", "4x5"], "E-6"),

  // ---------------------------------------------------------------------------
  // Fujifilm
  // ---------------------------------------------------------------------------
  stock("fuji-c200", "Fujifilm", "C200", 200, ["35mm"], "C-41"),
  stock("fuji-superia-xtra-400", "Fujifilm", "Superia X-TRA 400", 400, ["35mm"], "C-41"),
  stock("fuji-neopan-acros-ii", "Fujifilm", "Neopan Acros II 100", 100, ["35mm", "120"], "BW"),
  stock("fuji-velvia-50", "Fujifilm", "Velvia 50", 50, ["35mm", "120", "4x5"], "E-6"),
  stock("fuji-velvia-100", "Fujifilm", "Velvia 100", 100, ["35mm", "120", "4x5"], "E-6"),
  stock("fuji-provia-100f", "Fujifilm", "Provia 100F", 100, ["35mm", "120", "4x5"], "E-6"),

  // ---------------------------------------------------------------------------
  // Ilford
  // ---------------------------------------------------------------------------
  stock("ilford-panf-50", "Ilford", "Pan F Plus 50", 50, ["35mm", "120"], "BW"),
  stock("ilford-fp4-125", "Ilford", "FP4 Plus 125", 125, ["35mm", "120", "4x5", "8x10"], "BW"),
  stock("ilford-hp5-400", "Ilford", "HP5 Plus 400", 400, ["35mm", "120", "4x5", "8x10"], "BW"),
  stock("ilford-delta-100", "Ilford", "Delta 100", 100, ["35mm", "120", "4x5"], "BW"),
  stock("ilford-delta-400", "Ilford", "Delta 400", 400, ["35mm", "120"], "BW"),
  stock("ilford-delta-3200", "Ilford", "Delta 3200", 3200, ["35mm", "120"], "BW"),
  stock("ilford-xp2-super", "Ilford", "XP2 Super 400", 400, ["35mm", "120"], "BW-C41"),
  stock("ilford-sfx-200", "Ilford", "SFX 200", 200, ["35mm", "120"], "BW"),
  stock("ilford-ortho-plus", "Ilford", "Ortho Plus 80", 80, ["35mm", "120", "4x5", "8x10"], "BW"),

  // ---------------------------------------------------------------------------
  // Kentmere
  // ---------------------------------------------------------------------------
  stock("kentmere-pan-100", "Kentmere", "Pan 100", 100, ["35mm"], "BW"),
  stock("kentmere-pan-400", "Kentmere", "Pan 400", 400, ["35mm"], "BW"),

  // ---------------------------------------------------------------------------
  // CineStill
  // ---------------------------------------------------------------------------
  stock("cinestill-50d", "CineStill", "50D", 50, ["35mm", "120"], "C-41"),
  stock("cinestill-400d", "CineStill", "400D", 400, ["35mm", "120"], "C-41"),
  stock("cinestill-800t", "CineStill", "800T", 800, ["35mm", "120"], "C-41"),

  // ---------------------------------------------------------------------------
  // Lomography
  // ---------------------------------------------------------------------------
  stock("lomo-cn-100", "Lomography", "Color Negative 100", 100, ["35mm", "120"], "C-41"),
  stock("lomo-cn-400", "Lomography", "Color Negative 400", 400, ["35mm", "120"], "C-41"),
  stock("lomo-cn-800", "Lomography", "Color Negative 800", 800, ["35mm", "120"], "C-41"),
  stock("lomo-purple", "Lomography", "LomoChrome Purple", 400, ["35mm", "120"], "C-41"),
  stock("lomo-metropolis", "Lomography", "Metropolis", 400, ["35mm", "120"], "C-41"),
  stock("lomo-berlin-kino", "Lomography", "Berlin Kino 400", 400, ["35mm", "120"], "BW"),
  stock("lomo-potsdam-kino", "Lomography", "Potsdam Kino 100", 100, ["35mm", "120"], "BW"),
  stock("lomo-fantome-kino", "Lomography", "Fantôme Kino 8", 8, ["35mm", "120"], "BW"),
  stock("lomo-earl-grey", "Lomography", "Earl Grey 100", 100, ["35mm", "120"], "BW"),
  stock("lomo-lady-grey", "Lomography", "Lady Grey 400", 400, ["35mm", "120"], "BW"),

  // ---------------------------------------------------------------------------
  // Fomapan
  // ---------------------------------------------------------------------------
  stock("fomapan-100", "Fomapan", "Fomapan 100", 100, ["35mm", "120", "4x5", "8x10"], "BW"),
  stock("fomapan-200", "Fomapan", "Fomapan 200", 200, ["35mm", "120"], "BW"),
  stock("fomapan-400", "Fomapan", "Fomapan 400", 400, ["35mm", "120", "4x5"], "BW"),

  // ---------------------------------------------------------------------------
  // ADOX
  // ---------------------------------------------------------------------------
  stock("adox-silvermax-100", "ADOX", "Silvermax 100", 100, ["35mm"], "BW"),
  stock("adox-cms-20-ii", "ADOX", "CMS 20 II", 20, ["35mm"], "BW"),
  stock("adox-hr-50", "ADOX", "HR-50", 50, ["35mm"], "BW"),
  stock("adox-color-mission-200", "ADOX", "Color Mission 200", 200, ["35mm"], "C-41"),

  // ---------------------------------------------------------------------------
  // Rollei
  // ---------------------------------------------------------------------------
  stock("rollei-rpx-25", "Rollei", "RPX 25", 25, ["35mm", "120"], "BW"),
  stock("rollei-rpx-100", "Rollei", "RPX 100", 100, ["35mm", "120"], "BW"),
  stock("rollei-rpx-400", "Rollei", "RPX 400", 400, ["35mm", "120"], "BW"),
  stock("rollei-infrared-400", "Rollei", "Infrared 400", 400, ["35mm", "120"], "BW"),
  stock("rollei-retro-80s", "Rollei", "Retro 80S", 80, ["35mm", "120"], "BW"),
  stock("rollei-retro-400s", "Rollei", "Retro 400S", 400, ["35mm", "120"], "BW"),

  // ---------------------------------------------------------------------------
  // Bergger
  // ---------------------------------------------------------------------------
  stock("bergger-pancro-400", "Bergger", "Pancro 400", 400, ["35mm", "120", "4x5"], "BW"),

  // ---------------------------------------------------------------------------
  // JCH
  // ---------------------------------------------------------------------------
  stock("jch-streetpan-400", "JCH", "StreetPan 400", 400, ["35mm", "120"], "BW"),

  // ---------------------------------------------------------------------------
  // Shanghai
  // ---------------------------------------------------------------------------
  stock("shanghai-gp3-100", "Shanghai", "GP3 100", 100, ["35mm", "120", "4x5"], "BW"),

  // ---------------------------------------------------------------------------
  // Harman
  // ---------------------------------------------------------------------------
  stock("harman-phoenix-200", "Harman", "Phoenix 200", 200, ["35mm"], "C-41"),

  // ---------------------------------------------------------------------------
  // Washi
  // ---------------------------------------------------------------------------
  stock("washi-z", "Washi", "Z 400", 400, ["35mm"], "BW"),
  stock("washi-s", "Washi", "S 50", 50, ["35mm"], "BW"),

  // ---------------------------------------------------------------------------
  // Silberra
  // ---------------------------------------------------------------------------
  stock("silberra-pan-50", "Silberra", "PAN 50", 50, ["35mm", "120"], "BW"),
  stock("silberra-pan-160", "Silberra", "PAN 160", 160, ["35mm", "120"], "BW"),

  // ---------------------------------------------------------------------------
  // Film Washi / Ultrafine / Others
  // ---------------------------------------------------------------------------
  stock("dubblefilm-daily", "Dubblefilm", "Daily 400", 400, ["35mm"], "C-41"),
  stock("dubblefilm-cinema", "Dubblefilm", "Cinema 800", 800, ["35mm"], "C-41"),
  stock("kono-donau", "KONO!", "Donau 6", 6, ["35mm"], "BW"),
  stock("revolog-tesla", "Revolog", "Tesla", 200, ["35mm"], "C-41"),
  stock("yodica-andromeda", "Yodica", "Andromeda 400", 400, ["35mm"], "C-41"),

  // ---------------------------------------------------------------------------
  // Kosmo Foto
  // ---------------------------------------------------------------------------
  stock("kosmo-mono-100", "Kosmo Foto", "Mono 100", 100, ["35mm"], "BW"),
  stock("kosmo-agent-shadow", "Kosmo Foto", "Agent Shadow 400", 400, ["35mm"], "BW"),

  // ---------------------------------------------------------------------------
  // Ferrania
  // ---------------------------------------------------------------------------
  stock("ferrania-p30", "Ferrania", "P30 Alpha", 80, ["35mm"], "BW"),

  // ---------------------------------------------------------------------------
  // Orwo
  // ---------------------------------------------------------------------------
  stock("orwo-wolfen-nc500", "ORWO", "Wolfen NC500", 500, ["35mm"], "C-41"),
  stock("orwo-wolfen-n74", "ORWO", "Wolfen N74", 400, ["35mm"], "BW"),

  // ---------------------------------------------------------------------------
  // Polaroid / Instax (instant)
  // ---------------------------------------------------------------------------
  stock("polaroid-sx70", "Polaroid", "SX-70 Color", 160, ["instant"], "other"),
  stock("polaroid-600", "Polaroid", "600 Color", 640, ["instant"], "other"),
  stock("polaroid-itype", "Polaroid", "i-Type Color", 640, ["instant"], "other"),
  stock("polaroid-go", "Polaroid", "Go Color", 640, ["instant"], "other"),
  stock("polaroid-bw-600", "Polaroid", "600 B&W", 640, ["instant"], "other"),
  stock("instax-mini", "Fujifilm", "Instax Mini", 800, ["instant"], "other"),
  stock("instax-wide", "Fujifilm", "Instax Wide", 800, ["instant"], "other"),
  stock("instax-square", "Fujifilm", "Instax Square", 800, ["instant"], "other"),
];

/** Populate the filmStock table with seed data (idempotent via bulkPut) */
export async function seedFilmStocks(
  table: { bulkPut: (items: FilmStock[]) => Promise<unknown> },
): Promise<void> {
  await table.bulkPut(filmStocks);
}
