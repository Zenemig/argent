import PQueue from "p-queue";
import { getCache, setCache, initCache } from "./cache.js";

const USER_AGENT = "Argent-Scraper/1.0 (https://github.com/zenemig/argent; offline seed data)";

// One queue per domain: min 2s between requests
const queues = new Map<string, PQueue>();

function queueFor(domain: string): PQueue {
  let q = queues.get(domain);
  if (!q) {
    q = new PQueue({ interval: 2000, intervalCap: 1, concurrency: 1 });
    queues.set(domain, q);
  }
  return q;
}

/**
 * Fetch a URL with filesystem caching and per-domain rate limiting.
 * Cached responses are returned immediately without hitting the network.
 */
export async function cachedFetch(url: string, scraperName: string): Promise<string> {
  await initCache(scraperName);

  const cached = await getCache(scraperName, url);
  if (cached !== null) {
    console.log(`  [cache] ${url}`);
    return cached;
  }

  const domain = new URL(url).hostname;
  const queue = queueFor(domain);

  const data = await queue.add(async () => {
    console.log(`  [fetch] ${url}`);
    const res = await fetch(url, {
      headers: { "User-Agent": USER_AGENT },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
    return res.text();
  });

  if (!data) throw new Error(`Empty response from ${url}`);

  await setCache(scraperName, url, data);
  return data;
}
