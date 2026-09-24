import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  COSTS,
  PLAYER_LEVELS,
  createDefaultPoolConfig,
  type CopiesByCost,
  type Cost,
  type OddsByCost,
  type PlayerLevel,
  type PoolConfig,
  type ShopOddsByLevel,
} from "./types.js";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
export const POOL_CONFIG_FILE = join(ROOT, "data", "pool-config.json");

function clampCopies(n: number): number {
  if (!Number.isFinite(n)) return 1;
  return Math.max(0, Math.min(99, Math.floor(n)));
}

function clampPercent(n: number): number {
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(100, Math.floor(n)));
}

function normalizeOdds(raw: unknown, fallback: OddsByCost): OddsByCost {
  const next: OddsByCost = { ...fallback };
  if (!raw || typeof raw !== "object") return next;
  for (const c of COSTS) {
    const v = (raw as Record<string, unknown>)[String(c)];
    if (typeof v === "number") next[c] = clampPercent(v);
  }
  return next;
}

function normalize(raw: unknown): PoolConfig {
  const base = createDefaultPoolConfig();
  if (!raw || typeof raw !== "object") return base;

  const obj = raw as Partial<PoolConfig>;
  const copies: CopiesByCost = { ...base.copiesByCost };
  if (obj.copiesByCost && typeof obj.copiesByCost === "object") {
    for (const c of COSTS) {
      const v = (obj.copiesByCost as Record<string, unknown>)[String(c)];
      if (typeof v === "number") copies[c] = clampCopies(v);
    }
  }

  const shopOddsByLevel: ShopOddsByLevel = structuredClone(base.shopOddsByLevel);
  if (obj.shopOddsByLevel && typeof obj.shopOddsByLevel === "object") {
    for (const lv of PLAYER_LEVELS) {
      const row = (obj.shopOddsByLevel as Record<string, unknown>)[String(lv)];
      shopOddsByLevel[lv] = normalizeOdds(row, base.shopOddsByLevel[lv]);
    }
  }

  return { copiesByCost: copies, shopOddsByLevel };
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
    ...config,
    copiesByCost: {
      ...config.copiesByCost,
      [cost]: clampCopies(copies),
    },
  };
}

export function setShopOdds(
  config: PoolConfig,
  level: PlayerLevel,
  cost: Cost,
  percent: number,
): PoolConfig {
  return {
    ...config,
    shopOddsByLevel: {
      ...config.shopOddsByLevel,
      [level]: {
        ...config.shopOddsByLevel[level],
        [cost]: clampPercent(percent),
      },
    },
  };
}
