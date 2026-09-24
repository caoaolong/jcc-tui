import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..");

/** 金铲铲大数据 · 资料库 · 羁绊 */
export const TRAITS_URL = "https://jcc.datatft.com/database#trait";
export const DATA_DIR = join(ROOT, "data");
export const TRAITS_FILE = join(DATA_DIR, "traits.json");
