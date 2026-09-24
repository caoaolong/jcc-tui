import React, { useMemo } from "react";
import { Box, Text } from "ink";
import type { UnitInfo } from "./units/types.js";

type Props = {
  units: UnitInfo[];
  cellLabel: string;
  priceTab: number;
  listIndex: number;
  priceTabs: number[];
};

const LIST_VIEWPORT = 10;

export function UnitPicker({ units, cellLabel, priceTab, listIndex, priceTabs }: Props) {
  const price = priceTabs[priceTab] ?? priceTabs[0] ?? 1;
  const list = useMemo(
    () => units.filter((u) => u.price === price).sort((a, b) => a.name.localeCompare(b.name, "zh")),
    [units, price],
  );

  const start = Math.max(0, Math.min(listIndex - Math.floor(LIST_VIEWPORT / 2), list.length - LIST_VIEWPORT));
  const view = list.slice(Math.max(0, start), Math.max(0, start) + LIST_VIEWPORT);

  return (
    <Box
      flexDirection="column"
      borderStyle="double"
      borderColor="cyan"
      paddingX={1}
      paddingY={0}
      width={44}
    >
      <Text bold>
        选择棋子 → 格子 <Text color="yellow">{cellLabel}</Text>
      </Text>

      <Box marginY={1}>
        {priceTabs.map((p, i) => {
          const active = i === priceTab;
          return (
            <Text key={p} color={active ? "black" : "cyan"} backgroundColor={active ? "cyan" : undefined} bold={active}>
              {` ${p}费 `}
            </Text>
          );
        })}
      </Box>

      <Box flexDirection="column" height={LIST_VIEWPORT}>
        {view.length === 0 ? (
          <Text dimColor>（该费用无棋子）</Text>
        ) : (
          view.map((unit, i) => {
            const absoluteIndex = Math.max(0, start) + i;
            const selected = absoluteIndex === listIndex;
            return (
              <Text key={unit.name} color={selected ? "black" : undefined} backgroundColor={selected ? "yellow" : undefined} bold={selected}>
                {selected ? "▸ " : "  "}
                {unit.name}
                <Text dimColor={!selected}> {unit.traits.slice(0, 2).join("/")}</Text>
              </Text>
            );
          })
        )}
      </Box>

      <Text dimColor>
        ←→ 切费用 · ↑↓ 选择 · Enter 确认 · Esc 关闭
      </Text>
      <Text dimColor>
        {list.length ? `${listIndex + 1}/${list.length}` : "0/0"}
      </Text>
    </Box>
  );
}

export function groupPriceTabs(units: UnitInfo[]): number[] {
  const set = new Set<number>();
  for (const u of units) {
    if (typeof u.price === "number" && u.price > 0) set.add(u.price);
  }
  return [...set].sort((a, b) => a - b);
}

export function unitsForPrice(units: UnitInfo[], price: number): UnitInfo[] {
  return units.filter((u) => u.price === price).sort((a, b) => a.name.localeCompare(b.name, "zh"));
}
