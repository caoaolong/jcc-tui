export type TraitLevel = {
  /** 激活所需人数 */
  count: number;
  /** 该档效果描述 */
  effect: string;
};

export type TraitInfo = {
  /** 羁绊名称 */
  name: string;
  /** 总体效果说明 */
  effect: string;
  /** 有效激活档位及效果 */
  levels: TraitLevel[];
};

export type TraitsFile = {
  source: string;
  scrapedAt: string;
  count: number;
  traits: TraitInfo[];
};
