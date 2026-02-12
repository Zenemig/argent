import { cachedFetch } from "../shared/fetch.js";

const WIKI_API = "https://en.wikipedia.org/w/api.php";

type FilmPage = {
  html: string;
  discontinued: boolean;
};

const PAGES = [
  { title: "List_of_photographic_films", discontinued: false },
  { title: "List_of_discontinued_photographic_films", discontinued: true },
];

export async function fetchFilmPages(scraperName: string): Promise<FilmPage[]> {
  const results: FilmPage[] = [];

  for (const page of PAGES) {
    const url = `${WIKI_API}?action=parse&page=${encodeURIComponent(page.title)}&format=json&prop=text`;
    const raw = await cachedFetch(url, scraperName);
    const json = JSON.parse(raw);
    const html: string | undefined = json?.parse?.text?.["*"];
    if (html) {
      results.push({ html, discontinued: page.discontinued });
    } else {
      console.warn(`  [warn] No HTML content for ${page.title}`);
    }
  }

  return results;
}
