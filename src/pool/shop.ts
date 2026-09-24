import type { UnitInfo } from "../units/types.js";
import { COSTS, type Cost, type OddsByCost, type PlayerLevel, type PoolConfig } from "./types.js";

/** 按概率抽取一个费用 */
export function rollCost(odds: OddsByCost): Cost {
  const weights = COSTS.map((c) => Math.max(0, odds[c] ?? 0));
  const sum = weights.reduce((a, b) => a + b, 0);
  if (sum <= 0) return 1;
  let r = Math.random() * sum;
  for (let i = 0; i < COSTS.length; i++) {
    r -= weights[i]!;
    if (r <= 0) return COSTS[i]!;
  }
  return COSTS[COSTS.length - 1]!;
}

/** 从某费用棋子中随机抽一张 */
export function pickUnitOfCost(units: UnitInfo[], cost: Cost): UnitInfo | null {
  const pool = units.filter((u) => u.price === cost);
  if (pool.length === 0) return null;
  return pool[Math.floor(Math.random() * pool.length)] ?? null;
}

export type ShopSlot = {
  unit: UnitInfo | null;
  cost: Cost | null;
};

/** 刷新商店：5 个栏位 */
export function rollShop(
  units: UnitInfo[],
  config: PoolConfig,
  level: PlayerLevel,
  slotCount = 5,
): ShopSlot[] {
  const odds = config.shopOddsByLevel[level];
  const slots: ShopSlot[] = [];
  for (let i = 0; i < slotCount; i++) {
    const cost = rollCost(odds);
    const unit = pickUnitOfCost(units, cost);
    slots.push({ unit, cost: unit ? cost : null });
  }
  return slots;
}

export function oddsRowSum(odds: OddsByCost): number {
  return COSTS.reduce((s, c) => s + (odds[c] ?? 0), 0);
}
