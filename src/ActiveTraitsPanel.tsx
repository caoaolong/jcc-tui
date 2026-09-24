import React from "react";
import { Box, Text } from "ink";
import type { ActiveTraitRow } from "./activeTraits.js";

type Props = {
  rows: ActiveTraitRow[];
};

/**
 * 右侧羁绊面板：显示棋盘羁绊数量；已激活高亮。
 */
export function ActiveTraitsPanel({ rows }: Props) {
  const activated = rows.filter((r) => r.activeLevel);
  const pending = rows.filter((r) => !r.activeLevel);

  return (
    <Box
      flexDirection="column"
      borderStyle="single"
      borderColor="magenta"
      paddingX={1}
      width={28}
      minHeight={12}
    >
      <Text bold color="magenta">
        羁绊
      </Text>
      <Text dimColor>已激活 {activated.length}</Text>

      {rows.length === 0 ? (
        <Text dimColor>（棋盘空）</Text>
      ) : (
        <Box flexDirection="column" marginTop={1}>
          {activated.map((row) => (
            <TraitLine key={row.name} row={row} active />
          ))}
          {pending.length > 0 && activated.length > 0 ? (
            <Text dimColor>── 未激活 ──</Text>
          ) : null}
          {pending.map((row) => (
            <TraitLine key={row.name} row={row} active={false} />
          ))}
        </Box>
      )}
    </Box>
  );
}

function TraitLine({ row, active }: { row: ActiveTraitRow; active: boolean }) {
  const thresholds =
    row.thresholds.length > 0 ? row.thresholds.join("/") : "?";
  const progress =
    row.nextCount !== null ? `${row.count}/${row.nextCount}` : `${row.count}`;

  return (
    <Text>
      <Text color={active ? "green" : "gray"} bold={active}>
        {active ? "● " : "○ "}
        {row.name}
      </Text>
      <Text color={active ? "yellow" : "gray"}> {progress}</Text>
      <Text dimColor> ({thresholds})</Text>
    </Text>
  );
}
