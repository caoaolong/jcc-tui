import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..");

/** 金铲铲大数据 · 资料库 · 弈子 */
export const UNITS_URL = "https://jcc.datatft.com/database#unit";
export const DATA_DIR = join(ROOT, "data");
export const UNITS_FILE = join(DATA_DIR, "units.json");
export const UNITS_NAMES_FILE = join(DATA_DIR, "units-names.json");
