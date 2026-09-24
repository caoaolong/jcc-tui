import React, { useMemo } from "react";
import { Box, Text } from "ink";
import type { BoardMap } from "./board.js";
import { renderBrickBuffer, type Cell, type PriceByName } from "./buffer.js";

type Props = {
  focusedId: string | null;
  board: BoardMap;
  priceByName?: PriceByName;
};

/** 把同行同色格子合并成一段，减少 Text 节点数量 */
function compressRow(cells: Cell[]): Array<{ key: string; cell: Cell; text: string }> {
  const parts: Array<{ key: string; cell: Cell; text: string }> = [];
  for (let i = 0; i < cells.length; i++) {
    const cell = cells[i]!;
    if (cell.skip) continue;
    const last = parts[parts.length - 1];
    const sameStyle =
      last &&
      last.cell.color === cell.color &&
      last.cell.bold === cell.bold &&
      (last.cell.ch === " ") === (cell.ch === " ");
    if (sameStyle) {
      last!.text += cell.ch;
    } else {
      parts.push({ key: `${i}`, cell, text: cell.ch });
    }
  }
  return parts;
}

export function BrickMap({ focusedId, board, priceByName }: Props) {
  const frame = useMemo(
    () => renderBrickBuffer(focusedId, board, priceByName),
    [focusedId, board, priceByName],
  );

  return (
    <Box flexDirection="column">
      {frame.rows.map((row, y) => (
        <Text key={y}>
          {compressRow(row).map((part) =>
            part.cell.ch === " " ? (
              <Text key={part.key}>{part.text}</Text>
            ) : (
              <Text key={part.key} color={part.cell.color} bold={part.cell.bold}>
                {part.text}
              </Text>
            ),
          )}
        </Text>
      ))}
    </Box>
  );
}
