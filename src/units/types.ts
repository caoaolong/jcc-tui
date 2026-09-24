export type UnitInfo = {
  name: string;
  /** 费用，对应 div.hero-price */
  price: number | null;
  traits: string[];
};

export type UnitsFile = {
  source: string;
  scrapedAt: string;
  count: number;
  units: UnitInfo[];
};
