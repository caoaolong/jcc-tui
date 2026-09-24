import React from "react";
import { Box, Text } from "ink";
import { oddsRowSum } from "./pool/shop.js";
import {
  COSTS,
  PLAYER_LEVELS,
  type OddsByCost,
  type PlayerLevel,
} from "./pool/types.js";

type Props = {
  level: PlayerLevel;
  odds: OddsByCost;
};

/**
 * 局内设置：调整当前玩家等级，并只读展示该等级商店费用概率。
 */
export function MatchSettings({ level, odds }: Props) {
  const sum = oddsRowSum(odds);

  return (
    <Box flexDirection="column" borderStyle="double" borderColor="cyan" paddingX={2} paddingY={1} width={42}>
      <Text bold color="cyan">
        局内设置
      </Text>
      <Text dimColor>当前等级决定商店各费用出现概率</Text>

      <Box marginTop={1} flexDirection="column">
        <Text>
          等级{" "}
          <Text bold color="yellow">
            {level}
          </Text>
          <Text dimColor> （{PLAYER_LEVELS[0]}–{PLAYER_LEVELS[PLAYER_LEVELS.length - 1]}）</Text>
        </Text>
        <Box marginTop={0} flexDirection="row">
          {PLAYER_LEVELS.map((lv) => (
            <Text key={lv} bold={lv === level} inverse={lv === level} color={lv === level ? undefined : "gray"}>
              {` ${lv} `}
            </Text>
          ))}
        </Box>
      </Box>

      <Box marginTop={1} flexDirection="column">
        <Text dimColor>本级商店概率（只读）</Text>
        <Text>
          {COSTS.map((cost) => (
            <Text key={cost}>
              <Text dimColor>{` ${cost}费`}</Text>
              <Text color="white">{`${String(odds[cost]).padStart(3, " ")}%`}</Text>
            </Text>
          ))}
          <Text dimColor={sum === 100} color={sum === 100 ? "green" : "red"}>
            {`  Σ${String(sum).padStart(3, " ")}`}
          </Text>
        </Text>
      </Box>

      <Box marginTop={1} flexDirection="column">
        <Text dimColor>↑↓ / [ ] 调等级 · Enter / Esc 关闭并刷新商店</Text>
      </Box>
    </Box>
  );
}
