import React from "react";
import { Box, Text } from "ink";
import type { BenchSlots } from "./board.js";
import { BENCH_SIZE } from "./board.js";
import { borderColorForCost } from "./costColors.js";
import { truncateToDisplayWidth } from "./textWidth.js";

type Props = {
  slots: BenchSlots;
  focusSlot: number | null;
  priceByName?: Map<string, number | null>;
};

const SLOT_W = 10;

/**
 * 左侧备战席：固定 9 栏。
 */
export function BenchBar({ slots, focusSlot, priceByName }: Props) {
  return (
    <Box flexDirection="column" borderStyle="single" borderColor="white" paddingX={1}>
      <Text bold>备战席</Text>
      <Text dimColor>↑↓ 选择 · Enter 上场</Text>
      <Box flexDirection="column" marginTop={0}>
        {Array.from({ length: BENCH_SIZE }, (_, i) => {
          const piece = slots[i] ?? null;
          const focused = focusSlot === i;
          const name = piece
            ? truncateToDisplayWidth(piece.name, SLOT_W - 2)
            : "·";
          const price = piece && priceByName ? priceByName.get(piece.name) : null;
          const color =
            price != null ? borderColorForCost(price) ?? "gray" : focused ? "cyan" : "gray";
          const star = piece ? `${piece.stars}★` : "";
          return (
            <Box key={i} flexDirection="row">
              <Text color={focused ? "cyan" : "gray"} bold={focused}>
                {focused ? "▸" : " "}
                {i + 1}.
              </Text>
              <Text color={color} bold={focused}>
                {` ${name}`}
              </Text>
              {star ? <Text dimColor> {star}</Text> : null}
            </Box>
          );
        })}
      </Box>
    </Box>
  );
}
