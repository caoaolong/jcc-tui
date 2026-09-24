/** 1–5 费：每种棋子在牌库中的张数 */
export type Cost = 1 | 2 | 3 | 4 | 5;

export type CopiesByCost = Record<Cost, number>;

export type PoolConfig = {
  /** 各费用「每张棋子」的牌库份数 */
  copiesByCost: CopiesByCost;
};

export type CostPoolSummary = {
  cost: Cost;
  /** 该费用有多少种棋子 */
  kinds: number;
  /** 每种棋子份数 */
  copiesEach: number;
  /** 该费用牌库总张数 = kinds × copiesEach */
  total: number;
};

export const COSTS: Cost[] = [1, 2, 3, 4, 5];

/** 接近金铲铲常见默认值 */
export const DEFAULT_COPIES_BY_COST: CopiesByCost = {
  1: 30,
  2: 25,
  3: 18,
  4: 10,
  5: 9,
};

export function createDefaultPoolConfig(): PoolConfig {
  return { copiesByCost: { ...DEFAULT_COPIES_BY_COST } };
}
