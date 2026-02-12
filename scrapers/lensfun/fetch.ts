import { cachedFetch } from "../shared/fetch.js";

const GITHUB_API = "https://api.github.com/repos/lensfun/lensfun/contents/data/db";
const GITHUB_RAW = "https://raw.githubusercontent.com/lensfun/lensfun/master/data/db";

/**
 * Fetch the list of XML files from Lensfun's data/db directory via GitHub API.
 */
export async function fetchLensfunFileList(scraperName: string): Promise<string[]> {
  const raw = await cachedFetch(GITHUB_API, scraperName);
  const entries: Array<{ name: string; type: string }> = JSON.parse(raw);
  return entries
    .filter((e) => e.type === "file" && e.name.endsWith(".xml"))
    .map((e) => e.name);
}

/**
 * Fetch all XML files from Lensfun's GitHub repo.
 */
export async function fetchLensfunFiles(
  filenames: string[],
  scraperName: string,
): Promise<string[]> {
  const results: string[] = [];
  for (const name of filenames) {
    const url = `${GITHUB_RAW}/${name}`;
    const xml = await cachedFetch(url, scraperName);
    results.push(xml);
  }
  return results;
}
