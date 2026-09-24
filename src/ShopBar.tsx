import React from "react";
import { Box, Text } from "ink";
import { borderColorForCost } from "./costColors.js";
import type { ShopSlot } from "./pool/shop.js";
import type { PlayerLevel } from "./pool/types.js";
import { displayWidth, truncateToDisplayWidth } from "./textWidth.js";

type Props = {
  slots: ShopSlot[];
  level: PlayerLevel;
  /** 当前高亮的商店栏位，null 表示未选中商店 */
  focusSlot: number | null;
};

/** 内容区宽度（不含边框） */
const INNER_WIDTH = 10;
const SLOT_WIDTH = INNER_WIDTH + 2; // 含边框
/** 内容行数：名称 1 + 羁绊底对齐区 4（末行与费用同行） */
const CONTENT_ROWS = 5;
const TRAIT_AREA_ROWS = CONTENT_ROWS - 1;
const MAX_TRAITS = 3;

type CardRow =
  | { kind: "text"; text: string; role: "name" | "trait" | "empty" }
  | { kind: "traitPrice"; trait: string; price: string };

/**
 * 棋盘下方商店：固定 5 个栏位。
 * 名称左上；羁绊左下底对齐（最多 3）；末行羁绊与费用同行（费用右下）。
 */
export function ShopBar({ slots, level, focusSlot }: Props) {
  return (
    <Box flexDirection="column" marginTop={1}>
      <Text dimColor>
        商店（等级 {level}）· D 刷新 · 1-5 购买到备战席 · 满3含场上自动合成
      </Text>
      <Box flexDirection="row" gap={1} marginTop={0}>
        {slots.map((slot, i) => {
          const focused = focusSlot === i;
          const price = slot.unit?.price ?? null;
          const borderColor = focused
            ? "cyan"
            : borderColorForCost(price) ?? "gray";
          const rows = buildCardRows(slot);
          const priceColor = borderColorForCost(price) ?? (focused ? "yellow" : "gray");

          return (
            <Box
              key={i}
              flexDirection="column"
              borderStyle={focused ? "double" : "single"}
              borderColor={borderColor}
              width={SLOT_WIDTH}
            >
              {rows.map((row, idx) => {
                if (row.kind === "traitPrice") {
                  return (
                    <Text key={idx}>
                      <Text dimColor>{row.trait}</Text>
                      <Text color={priceColor}>{row.price}</Text>
                    </Text>
                  );
                }
                if (row.role === "name") {
                  return (
                    <Text key={idx} color={focused ? "cyan" : "white"} bold={focused}>
                      {row.text}
                    </Text>
                  );
                }
                if (row.role === "trait") {
                  return (
                    <Text key={idx} dimColor>
                      {row.text}
                    </Text>
                  );
                }
                return <Text key={idx}>{row.text}</Text>;
              })}
            </Box>
          );
        })}
      </Box>
    </Box>
  );
}

function buildCardRows(slot: ShopSlot): CardRow[] {
  const rows: CardRow[] = Array.from({ length: CONTENT_ROWS }, () => ({
    kind: "text",
    text: padRight("", INNER_WIDTH),
    role: "empty",
  }));

  if (!slot.unit) return rows;

  rows[0] = {
    kind: "text",
    text: padRight(truncateToDisplayWidth(slot.unit.name, INNER_WIDTH), INNER_WIDTH),
    role: "name",
  };

  const traits = slot.unit.traits.slice(0, MAX_TRAITS);
  const priceText = slot.unit.price != null ? String(slot.unit.price) : "";

  if (traits.length === 0) {
    rows[CONTENT_ROWS - 1] = {
      kind: "traitPrice",
      trait: padRight("", INNER_WIDTH - displayWidth(priceText)),
      price: priceText,
    };
    return rows;
  }

  // 羁绊底对齐：末条始终在最后一行，并与费用同行
  const start = TRAIT_AREA_ROWS - traits.length;
  for (let t = 0; t < traits.length; t++) {
    const row = 1 + start + t;
    const trait = traits[t]!;
    if (t === traits.length - 1) {
      const composed = composeLeftRightParts(trait, priceText, INNER_WIDTH);
      rows[row] = { kind: "traitPrice", trait: composed.left, price: composed.right };
    } else {
      rows[row] = {
        kind: "text",
        text: padRight(truncateToDisplayWidth(trait, INNER_WIDTH), INNER_WIDTH),
        role: "trait",
      };
    }
  }
  return rows;
}

function composeLeftRightParts(
  left: string,
  right: string,
  width: number,
): { left: string; right: string } {
  const rw = displayWidth(right);
  if (rw <= 0) {
    return { left: padRight(truncateToDisplayWidth(left, width), width), right: "" };
  }
  if (!left) {
    return { left: " ".repeat(Math.max(0, width - rw)), right };
  }
  const avail = Math.max(0, width - rw);
  const leftPart = truncateToDisplayWidth(left, avail);
  const gap = Math.max(0, avail - displayWidth(leftPart));
  return { left: leftPart + " ".repeat(gap), right };
}

function padRight(text: string, width: number): string {
  const w = displayWidth(text);
  if (w >= width) return text;
  return text + " ".repeat(width - w);
}
