import { db } from "./db";

/**
 * Read a setting from the _syncMeta table.
 * Returns null if the key doesn't exist.
 */
export async function getSetting(key: string): Promise<string | null> {
  const row = await db._syncMeta.get(key);
  return row?.value ?? null;
}

/**
 * Write a setting to the _syncMeta table.
 * Uses put() so it creates or overwrites.
 */
export async function setSetting(key: string, value: string): Promise<void> {
  await db._syncMeta.put({ key, value });
}

/**
 * Apply theme to the HTML element.
 * Accepts a theme string ("dark", "light", or "system") and manipulates classes.
 */
export function applyTheme(
  theme: string,
  htmlElement: { classList: { add(c: string): void; remove(c: string): void; toggle(c: string, force: boolean): void } },
  matchMedia: { matches: boolean },
): void {
  if (theme === "dark") {
    htmlElement.classList.add("dark");
    htmlElement.classList.remove("light");
  } else if (theme === "light") {
    htmlElement.classList.remove("dark");
    htmlElement.classList.add("light");
  } else {
    // System
    const prefersDark = matchMedia.matches;
    htmlElement.classList.toggle("dark", prefersDark);
    htmlElement.classList.toggle("light", !prefersDark);
  }
}
