import type { UnitInfo } from "../units/types.js";
import { COSTS, type Cost, type CostPoolSummary, type PoolConfig } from "./types.js";

/** 统计各费用棋子种类数 */
export function countKindsByCost(units: UnitInfo[]): Record<Cost, number> {
  const kinds: Record<Cost, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  const seen = new Set<string>();
  for (const u of units) {
    if (u.price === null || u.price < 1 || u.price > 5) continue;
    const cost = u.price as Cost;
    if (seen.has(u.name)) continue;
    seen.add(u.name);
    kinds[cost] += 1;
  }
  return kinds;
}

/** 按配置计算各费用牌库总量 */
export function summarizePool(units: UnitInfo[], config: PoolConfig): CostPoolSummary[] {
  const kinds = countKindsByCost(units);
  return COSTS.map((cost) => {
    const copiesEach = config.copiesByCost[cost];
    const k = kinds[cost];
    return {
      cost,
      kinds: k,
      copiesEach,
      total: k * copiesEach,
    };
  });
}

export function poolGrandTotal(summaries: CostPoolSummary[]): number {
  return summaries.reduce((sum, s) => sum + s.total, 0);
}
