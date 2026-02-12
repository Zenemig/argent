import { cachedFetch } from "../shared/fetch.js";

const PHOTON_URL = "https://photondetector.com/tools_ref/filmdata/";

export async function fetchPhotonDetectorPage(scraperName: string): Promise<string> {
  return cachedFetch(PHOTON_URL, scraperName);
}
