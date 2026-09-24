/** 棋子费用对应边框色：1灰 2绿 3蓝 4紫 5橙 */
export const COST_BORDER_COLOR: Record<number, string> = {
  1: "gray",
  2: "green",
  3: "blue",
  4: "magenta",
  5: "#ff8c00",
};

export function borderColorForCost(price: number | null | undefined): string | null {
  if (price == null || price < 1 || price > 5) return null;
  return COST_BORDER_COLOR[price] ?? null;
}
