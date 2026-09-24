import React from "react";
import { Box, Text } from "ink";
import { COSTS, type Cost, type PoolConfig } from "./pool/types.js";
import type { CostPoolSummary } from "./pool/types.js";

type Props = {
  config: PoolConfig;
  summaries: CostPoolSummary[];
  /** 当前聚焦的费用行 0–4 */
  focusIndex: number;
  grandTotal: number;
};

/**
 * 牌库设置：配置 1–5 费每种棋子份数，并显示档位总张数。
 */
export function PoolSettings({ config, summaries, focusIndex, grandTotal }: Props) {
  return (
    <Box flexDirection="column" borderStyle="double" borderColor="yellow" paddingX={1} width={52}>
      <Text bold color="yellow">
        牌库设置
      </Text>
      <Text dimColor>配置每种费用「每张棋子」的份数；总量 = 种类 × 份数</Text>

      <Box marginTop={1} flexDirection="column">
        <Text dimColor>
          {"费用  种类  每张份数      档位总量"}
        </Text>
        {COSTS.map((cost, i) => {
          const row = summaries.find((s) => s.cost === cost)!;
          const focused = i === focusIndex;
          return (
            <Text key={cost} bold={focused} inverse={focused} color={focused ? undefined : "white"}>
              {` ${cost}费   ${pad(row.kinds, 3)}    ${pad(config.copiesByCost[cost], 3)} 份     ${pad(row.total, 4)} 张 `}
            </Text>
          );
        })}
      </Box>

      <Box marginTop={1}>
        <Text bold>
          牌库总计：<Text color="cyan">{grandTotal}</Text> 张
        </Text>
      </Box>

      <Box marginTop={1} flexDirection="column">
        <Text dimColor>↑↓ 选择费用 · ←→ / -+ 调整份数</Text>
        <Text dimColor>r 恢复默认 · Enter / Esc 保存并返回</Text>
      </Box>
    </Box>
  );
}

function pad(n: number, width: number): string {
  return String(n).padStart(width, " ");
}

export type { Cost };
