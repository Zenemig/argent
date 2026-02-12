import {
  cameraStockOutputSchema,
  lensStockOutputSchema,
  mountStockOutputSchema,
  type CameraStockOutput,
  type LensStockOutput,
  type MountStockOutput,
  type ScraperResult,
} from "../shared/schemas.js";
import { writeOutput } from "../shared/write-output.js";
import { fetchLensfunFiles, fetchLensfunFileList } from "./fetch.js";
import { parseLensfunXml } from "./parser.js";
import { transformCamera, transformLens, transformMount } from "./transformer.js";

const SCRAPER_NAME = "lensfun";

export async function scrapeLensfun(): Promise<{
  cameras: ScraperResult<CameraStockOutput>;
  lenses: ScraperResult<LensStockOutput>;
  mounts: ScraperResult<MountStockOutput>;
}> {
  const cStats = { fetched: 0, parsed: 0, validated: 0, failed: 0 };
  const lStats = { fetched: 0, parsed: 0, validated: 0, failed: 0 };
  const mStats = { fetched: 0, parsed: 0, validated: 0, failed: 0 };
  const errors: string[] = [];

  const cameras: CameraStockOutput[] = [];
  const lenses: LensStockOutput[] = [];
  const mounts: MountStockOutput[] = [];
  const cameraIds = new Set<string>();
  const lensIds = new Set<string>();
  const mountIds = new Set<string>();

  // 1. Get file list
  console.log("[Lensfun] Fetching file list...");
  const files = await fetchLensfunFileList(SCRAPER_NAME);
  console.log(`  Found ${files.length} XML files`);

  // 2. Fetch XML files
  console.log("[Lensfun] Fetching XML files...");
  const xmlData = await fetchLensfunFiles(files, SCRAPER_NAME);
  cStats.fetched = lStats.fetched = mStats.fetched = xmlData.length;

  // 3. Parse all XML
  console.log("[Lensfun] Parsing XML...");
  const parsed = parseLensfunXml(xmlData);
  cStats.parsed = parsed.cameras.length;
  lStats.parsed = parsed.lenses.length;
  mStats.parsed = parsed.mounts.length;
  console.log(`  Cameras: ${parsed.cameras.length}, Lenses: ${parsed.lenses.length}, Mounts: ${parsed.mounts.length}`);

  // 4. Transform + validate cameras
  for (const raw of parsed.cameras) {
    try {
      const t = transformCamera(raw);
      if (cameraIds.has(t.id)) continue;
      const v = cameraStockOutputSchema.parse(t);
      cameraIds.add(v.id);
      cameras.push(v);
      cStats.validated++;
    } catch (err) {
      cStats.failed++;
      errors.push(`Camera ${raw.maker} ${raw.model}: ${err instanceof Error ? err.message : err}`);
    }
  }

  // 5. Transform + validate lenses
  for (const raw of parsed.lenses) {
    try {
      const t = transformLens(raw);
      if (lensIds.has(t.id)) continue;
      const v = lensStockOutputSchema.parse(t);
      lensIds.add(v.id);
      lenses.push(v);
      lStats.validated++;
    } catch (err) {
      lStats.failed++;
      errors.push(`Lens ${raw.maker} ${raw.model}: ${err instanceof Error ? err.message : err}`);
    }
  }

  // 6. Transform + validate mounts
  for (const raw of parsed.mounts) {
    try {
      const t = transformMount(raw);
      if (mountIds.has(t.id)) continue;
      const v = mountStockOutputSchema.parse(t);
      mountIds.add(v.id);
      mounts.push(v);
      mStats.validated++;
    } catch (err) {
      mStats.failed++;
      errors.push(`Mount ${raw.name}: ${err instanceof Error ? err.message : err}`);
    }
  }

  // 7. Write outputs
  const cFp = await writeOutput("cameras.json", cameras);
  const lFp = await writeOutput("lenses.json", lenses);
  const mFp = await writeOutput("mounts.json", mounts);
  console.log(`[Lensfun] Done: ${cStats.validated} cameras → ${cFp}`);
  console.log(`  ${lStats.validated} lenses → ${lFp}`);
  console.log(`  ${mStats.validated} mounts → ${mFp}`);

  return {
    cameras: { success: true, data: cameras, errors, stats: cStats },
    lenses: { success: true, data: lenses, errors, stats: lStats },
    mounts: { success: true, data: mounts, errors, stats: mStats },
  };
}
