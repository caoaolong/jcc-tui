import type { UnitInfo } from "./units/types.js";
import type { TraitInfo, TraitLevel } from "./traits/types.js";
import type { BoardMap, BenchSlots } from "./board.js";
import { uniqueNamesOnField } from "./board.js";

export type ActiveTraitRow = {
  name: string;
  /** 棋盘上该羁绊棋子数量（同名棋子只计 1） */
  count: number;
  /** 已达成的最高档（未激活则为 null） */
  activeLevel: TraitLevel | null;
  /** 下一档所需人数（已满则为 null） */
  nextCount: number | null;
  /** 全部档位人数，如 [2,4,6] */
  thresholds: number[];
};

/**
 * 根据棋盘 + 备战席统计羁绊：同名弈子只计一次（与星级无关）。
 */
export function computeActiveTraits(
  board: BoardMap,
  bench: BenchSlots,
  units: UnitInfo[],
  traits: TraitInfo[],
): ActiveTraitRow[] {
  const unitByName = new Map(units.map((u) => [u.name, u]));
  const uniqueNames = uniqueNamesOnField(board, bench);

  const counts = new Map<string, number>();
  for (const name of uniqueNames) {
    const unit = unitByName.get(name);
    if (!unit) continue;
    for (const traitName of unit.traits) {
      counts.set(traitName, (counts.get(traitName) ?? 0) + 1);
    }
  }

  const traitByName = new Map(traits.map((t) => [t.name, t]));
  const rows: ActiveTraitRow[] = [];

  for (const [name, count] of counts) {
    const meta = traitByName.get(name);
    const levels = [...(meta?.levels ?? [])]
      .filter((lv) => lv.count > 0)
      .sort((a, b) => a.count - b.count);

    // 去重同 count 档（如宿敌可能有重复）
    const seen = new Set<number>();
    const uniqueLevels: TraitLevel[] = [];
    for (const lv of levels) {
      if (seen.has(lv.count)) continue;
      seen.add(lv.count);
      uniqueLevels.push(lv);
    }

    const thresholds = uniqueLevels.map((lv) => lv.count);
    let activeLevel: TraitLevel | null = null;
    for (const lv of uniqueLevels) {
      if (count >= lv.count) activeLevel = lv;
    }

    let nextCount: number | null = null;
    for (const lv of uniqueLevels) {
      if (count < lv.count) {
        nextCount = lv.count;
        break;
      }
    }

    rows.push({ name, count, activeLevel, nextCount, thresholds });
  }

  // 已激活优先，再按数量、名称
  rows.sort((a, b) => {
    const aa = a.activeLevel ? 1 : 0;
    const bb = b.activeLevel ? 1 : 0;
    if (aa !== bb) return bb - aa;
    if (a.count !== b.count) return b.count - a.count;
    return a.name.localeCompare(b.name, "zh");
  });

  return rows;
}
