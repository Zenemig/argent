import { cachedFetch } from "../shared/fetch.js";

const CORNELL_URL = "https://www.graphics.cornell.edu/~westin/misc/mounts-by-register.html";

export async function fetchCornellPage(scraperName: string): Promise<string> {
  return cachedFetch(CORNELL_URL, scraperName);
}
