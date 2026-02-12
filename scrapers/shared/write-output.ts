import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUTPUT_DIR = path.resolve(__dirname, "../output");

export async function writeOutput(filename: string, data: unknown): Promise<string> {
  await fs.mkdir(OUTPUT_DIR, { recursive: true });
  const fp = path.join(OUTPUT_DIR, filename);
  await fs.writeFile(fp, JSON.stringify(data, null, 2) + "\n", "utf-8");
  return fp;
}

export async function readOutput<T>(filename: string): Promise<T | null> {
  try {
    const fp = path.join(OUTPUT_DIR, filename);
    const raw = await fs.readFile(fp, "utf-8");
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}
