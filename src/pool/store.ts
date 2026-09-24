import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  COSTS,
  createDefaultPoolConfig,
  type CopiesByCost,
  type Cost,
  type PoolConfig,
} from "./types.js";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
export const POOL_CONFIG_FILE = join(ROOT, "data", "pool-config.json");

function clampCopies(n: number): number {
  if (!Number.isFinite(n)) return 1;
  return Math.max(0, Math.min(99, Math.floor(n)));
}

function normalize(raw: unknown): PoolConfig {
  const base = createDefaultPoolConfig();
  if (!raw || typeof raw !== "object") return base;
  const copies = (raw as PoolConfig).copiesByCost;
  if (!copies || typeof copies !== "object") return base;
  const next: CopiesByCost = { ...base.copiesByCost };
  for (const c of COSTS) {
    const v = (copies as Record<string, unknown>)[String(c)];
    if (typeof v === "number") next[c] = clampCopies(v);
  }
  return { copiesByCost: next };
}

export function loadPoolConfig(): PoolConfig {
  if (!existsSync(POOL_CONFIG_FILE)) return createDefaultPoolConfig();
  try {
    return normalize(JSON.parse(readFileSync(POOL_CONFIG_FILE, "utf8")));
  } catch {
    return createDefaultPoolConfig();
  }
}

export function savePoolConfig(config: PoolConfig): void {
  mkdirSync(dirname(POOL_CONFIG_FILE), { recursive: true });
  const normalized = normalize(config);
  writeFileSync(POOL_CONFIG_FILE, JSON.stringify(normalized, null, 2), "utf8");
}

export function setCopies(config: PoolConfig, cost: Cost, copies: number): PoolConfig {
  return {
    copiesByCost: {
      ...config.copiesByCost,
      [cost]: clampCopies(copies),
    },
  };
}
