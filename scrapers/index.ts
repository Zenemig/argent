import { scrapeWikipediaFilms } from "./wikipedia-films/scraper.js";
import { scrapeLensfun } from "./lensfun/scraper.js";
import { scrapeCornellMounts } from "./cornell-mounts/scraper.js";
import { scrapePhotonDetector } from "./photon-detector/scraper.js";
import { scrapeBigFilmDatabase } from "./big-film-database/scraper.js";

const SCRAPERS = {
  films: { name: "Wikipedia Films", fn: scrapeWikipediaFilms },
  lensfun: { name: "Lensfun (Cameras, Lenses, Mounts)", fn: scrapeLensfun },
  mounts: { name: "Cornell Mounts (register distances)", fn: scrapeCornellMounts },
  codes: { name: "Photon Detector (edge/notch codes)", fn: scrapePhotonDetector },
  dx: { name: "Big Film Database (DX codes)", fn: scrapeBigFilmDatabase },
} as const;

type ScraperKey = keyof typeof SCRAPERS;

async function main(): Promise<void> {
  const arg = process.argv[2] as ScraperKey | "all" | undefined;
  const target = arg || "all";

  console.log(`\n=== Argent Seed Data Scraper ===`);
  console.log(`Target: ${target}\n`);

  const keys: ScraperKey[] = target === "all"
    ? (Object.keys(SCRAPERS) as ScraperKey[])
    : [target];

  if (target !== "all" && !(target in SCRAPERS)) {
    console.error(`Unknown scraper: "${target}"`);
    console.error(`Available: ${Object.keys(SCRAPERS).join(", ")}, all`);
    process.exit(1);
  }

  let hasErrors = false;

  for (const key of keys) {
    const scraper = SCRAPERS[key];
    console.log(`\n--- ${scraper.name} ---`);
    try {
      await scraper.fn();
    } catch (err) {
      hasErrors = true;
      console.error(`[ERROR] ${scraper.name} failed:`, err);
    }
  }

  console.log(`\n=== Scraping ${hasErrors ? "completed with errors" : "complete"} ===\n`);
  if (hasErrors) process.exit(1);
}

main();
