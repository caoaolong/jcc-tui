/** 1–5 费：每种棋子在牌库中的张数 */
export type Cost = 1 | 2 | 3 | 4 | 5;

/** 玩家等级（商店概率表） */
export type PlayerLevel = 4 | 5 | 6 | 7 | 8 | 9 | 10;

export type CopiesByCost = Record<Cost, number>;

/** 某等级下各费用出现概率（百分比，通常合计 100） */
export type OddsByCost = Record<Cost, number>;

export type ShopOddsByLevel = Record<PlayerLevel, OddsByCost>;

export type PoolConfig = {
  /** 各费用「每张棋子」的牌库份数 */
  copiesByCost: CopiesByCost;
  /** 4–10 级商店各费用出现概率（%） */
  shopOddsByLevel: ShopOddsByLevel;
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
export const PLAYER_LEVELS: PlayerLevel[] = [4, 5, 6, 7, 8, 9, 10];

/** 接近金铲铲常见默认值 */
export const DEFAULT_COPIES_BY_COST: CopiesByCost = {
  1: 30,
  2: 25,
  3: 18,
  4: 10,
  5: 9,
};

export const DEFAULT_SHOP_ODDS_BY_LEVEL: ShopOddsByLevel = {
  4: { 1: 55, 2: 30, 3: 15, 4: 0, 5: 0 },
  5: { 1: 45, 2: 33, 3: 20, 4: 2, 5: 0 },
  6: { 1: 35, 2: 35, 3: 25, 4: 5, 5: 0 },
  7: { 1: 22, 2: 35, 3: 30, 4: 12, 5: 1 },
  8: { 1: 15, 2: 25, 3: 35, 4: 20, 5: 5 },
  9: { 1: 10, 2: 15, 3: 30, 4: 30, 5: 15 },
  10: { 1: 5, 2: 10, 3: 30, 4: 35, 5: 20 },
};

export function createDefaultPoolConfig(): PoolConfig {
  return {
    copiesByCost: { ...DEFAULT_COPIES_BY_COST },
    shopOddsByLevel: structuredClone(DEFAULT_SHOP_ODDS_BY_LEVEL),
  };
}
