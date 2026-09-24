import { existsSync, readFileSync } from "node:fs";
import { UNITS_FILE, UNITS_URL } from "./paths.js";
import { scrapeAndSave, type ScrapeProgress } from "./scrape.js";
import type { UnitsFile } from "./types.js";

function isValidUnitsFile(data: unknown): data is UnitsFile {
  if (!data || typeof data !== "object") return false;
  const obj = data as UnitsFile;
  if (!Array.isArray(obj.units) || obj.units.length === 0) return false;
  // 旧来源 /units 缓存视为无效，触发按资料库页重新爬取
  if (typeof obj.source !== "string" || !obj.source.includes("/database")) return false;
  return obj.units.every(
    (u) =>
      u &&
      typeof u.name === "string" &&
      Array.isArray(u.traits) &&
      (typeof u.price === "number" || u.price === null),
  );
}

export function loadUnitsFile(): UnitsFile | null {
  if (!existsSync(UNITS_FILE)) return null;
  try {
    const raw = JSON.parse(readFileSync(UNITS_FILE, "utf8")) as unknown;
    return isValidUnitsFile(raw) ? raw : null;
  } catch {
    return null;
  }
}

/**
 * 首次启动：本地无有效 units.json 时爬取并保存；否则直接读取。
 */
export async function ensureUnits(onProgress?: ScrapeProgress): Promise<UnitsFile> {
  const local = loadUnitsFile();
  if (local) {
    onProgress?.(`已加载本地数据 ${UNITS_FILE}（${local.count} 个棋子）`);
    return local;
  }
  onProgress?.(`本地无有效 units.json，开始从 ${UNITS_URL} 爬取…`);
  return scrapeAndSave(onProgress);
}
