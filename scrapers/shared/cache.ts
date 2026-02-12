import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CACHE_DIR = path.resolve(__dirname, "../cache");

function cacheFilePath(scraperName: string, key: string): string {
  const safe = Buffer.from(key).toString("base64url").slice(0, 200);
  return path.join(CACHE_DIR, scraperName, `${safe}.txt`);
}

export async function initCache(scraperName: string): Promise<void> {
  await fs.mkdir(path.join(CACHE_DIR, scraperName), { recursive: true });
}

export async function getCache(scraperName: string, key: string): Promise<string | null> {
  try {
    return await fs.readFile(cacheFilePath(scraperName, key), "utf-8");
  } catch {
    return null;
  }
}

export async function setCache(scraperName: string, key: string, data: string): Promise<void> {
  const fp = cacheFilePath(scraperName, key);
  await fs.mkdir(path.dirname(fp), { recursive: true });
  await fs.writeFile(fp, data, "utf-8");
}
