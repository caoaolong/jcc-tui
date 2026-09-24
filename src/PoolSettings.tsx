import React from "react";
import { Box, Text } from "ink";
import { oddsRowSum } from "./pool/shop.js";
import {
  COSTS,
  PLAYER_LEVELS,
  type Cost,
  type PlayerLevel,
  type PoolConfig,
  type CostPoolSummary,
} from "./pool/types.js";

export type SettingsSection = "copies" | "odds";

type Props = {
  config: PoolConfig;
  summaries: CostPoolSummary[];
  section: SettingsSection;
  /** copies：0–4；odds：levelIndex * 5 + costIndex */
  focusIndex: number;
  grandTotal: number;
};

/**
 * 设置页：牌库份数 + 各等级商店概率。
 */
export function PoolSettings({
  config,
  summaries,
  section,
  focusIndex,
  grandTotal,
}: Props) {
  return (
    <Box flexDirection="column" borderStyle="double" borderColor="yellow" paddingX={1} width={58}>
      <Text bold color="yellow">
        设置
      </Text>
      <Text>
        <Text color={section === "copies" ? "black" : "yellow"} backgroundColor={section === "copies" ? "yellow" : undefined} bold>
          {" 牌库份数 "}
        </Text>
        <Text> </Text>
        <Text color={section === "odds" ? "black" : "yellow"} backgroundColor={section === "odds" ? "yellow" : undefined} bold>
          {" 商店概率 "}
        </Text>
        <Text dimColor>  · Tab 切换</Text>
      </Text>

      {section === "copies" ? (
        <CopiesSection config={config} summaries={summaries} focusIndex={focusIndex} grandTotal={grandTotal} />
      ) : (
        <OddsSection config={config} focusIndex={focusIndex} />
      )}

      <Box marginTop={1} flexDirection="column">
        <Text dimColor>
          {section === "copies"
            ? "↑↓ 选费用 · ←→ / -+ 调份数"
            : "↑↓←→ 选格子 · -+ 调概率%"}
        </Text>
        <Text dimColor>r 恢复默认 · Enter / Esc 保存返回</Text>
      </Box>
    </Box>
  );
}

function CopiesSection({
  config,
  summaries,
  focusIndex,
  grandTotal,
}: {
  config: PoolConfig;
  summaries: CostPoolSummary[];
  focusIndex: number;
  grandTotal: number;
}) {
  return (
    <Box marginTop={1} flexDirection="column">
      <Text dimColor>配置每种费用「每张棋子」份数；总量 = 种类 × 份数</Text>
      <Text dimColor>{"费用  种类  每张份数      档位总量"}</Text>
      {COSTS.map((cost, i) => {
        const row = summaries.find((s) => s.cost === cost)!;
        const focused = i === focusIndex;
        return (
          <Text key={cost} bold={focused} inverse={focused}>
            {` ${cost}费   ${pad(row.kinds, 3)}    ${pad(config.copiesByCost[cost], 3)} 份     ${pad(row.total, 4)} 张 `}
          </Text>
        );
      })}
      <Box marginTop={1}>
        <Text bold>
          牌库总计：<Text color="cyan">{grandTotal}</Text> 张
        </Text>
      </Box>
    </Box>
  );
}

function OddsSection({ config, focusIndex }: { config: PoolConfig; focusIndex: number }) {
  const levelIndex = Math.floor(focusIndex / COSTS.length);
  const costIndex = focusIndex % COSTS.length;

  return (
    <Box marginTop={1} flexDirection="column">
      <Text dimColor>玩家等级 × 费用出现概率（%），行合计建议 100</Text>
      <Text dimColor>{"等级  1费  2费  3费  4费  5费  合计"}</Text>
      {PLAYER_LEVELS.map((level, li) => {
        const odds = config.shopOddsByLevel[level];
        const sum = oddsRowSum(odds);
        return (
          <Text key={level}>
            <Text>{` ${level}级 `}</Text>
            {COSTS.map((cost, ci) => {
              const focused = li === levelIndex && ci === costIndex;
              const val = pad(odds[cost], 3);
              return (
                <Text key={cost} bold={focused} inverse={focused} color={focused ? undefined : "white"}>
                  {` ${val}%`}
                </Text>
              );
            })}
            <Text dimColor={sum === 100} color={sum === 100 ? "green" : "red"}>
              {`  ${pad(sum, 3)}`}
            </Text>
          </Text>
        );
      })}
    </Box>
  );
}

function pad(n: number, width: number): string {
  return String(n).padStart(width, " ");
}

export type { Cost, PlayerLevel };
