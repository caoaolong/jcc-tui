import { existsSync, readFileSync } from "node:fs";
import { TRAITS_FILE, TRAITS_URL } from "./paths.js";
import { scrapeTraitsAndSave, type ScrapeProgress } from "./scrape.js";
import type { TraitsFile } from "./types.js";

function isValidTraitsFile(data: unknown): data is TraitsFile {
  if (!data || typeof data !== "object") return false;
  const obj = data as TraitsFile;
  if (!Array.isArray(obj.traits) || obj.traits.length === 0) return false;
  if (typeof obj.source !== "string" || !obj.source.includes("#trait")) return false;
  return obj.traits.every(
    (t) =>
      t &&
      typeof t.name === "string" &&
      typeof t.effect === "string" &&
      Array.isArray(t.levels) &&
      t.levels.every(
        (lv) => lv && typeof lv.count === "number" && typeof lv.effect === "string",
      ),
  );
}

export function loadTraitsFile(): TraitsFile | null {
  if (!existsSync(TRAITS_FILE)) return null;
  try {
    const raw = JSON.parse(readFileSync(TRAITS_FILE, "utf8")) as unknown;
    return isValidTraitsFile(raw) ? raw : null;
  } catch {
    return null;
  }
}

export async function ensureTraits(onProgress?: ScrapeProgress): Promise<TraitsFile> {
  const local = loadTraitsFile();
  if (local) {
    onProgress?.(`已加载本地羁绊 ${TRAITS_FILE}（${local.count} 个）`);
    return local;
  }
  onProgress?.(`本地无有效 traits.json，开始从 ${TRAITS_URL} 爬取…`);
  return scrapeTraitsAndSave(onProgress);
}
