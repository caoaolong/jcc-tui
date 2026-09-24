import React from "react";
import { Box, Text, useStdout } from "ink";

export type HomeMenuItem = "board" | "settings" | "quit";

const ITEMS: Array<{ id: HomeMenuItem; label: string; hint: string }> = [
  { id: "board", label: "进入棋盘", hint: "1 / Enter" },
  { id: "settings", label: "设置", hint: "2" },
  { id: "quit", label: "退出", hint: "q / Esc" },
];

type Props = {
  focusIndex: number;
  unitsCount: number;
  traitsCount: number;
};

/**
 * 启动首页：跳转棋盘 / 设置。
 */
export function HomeScreen({ focusIndex, unitsCount, traitsCount }: Props) {
  const { stdout } = useStdout();
  const cols = stdout?.columns ?? 80;
  const rows = stdout?.rows ?? 24;

  return (
    <Box
      width={cols}
      height={rows}
      flexDirection="column"
      alignItems="center"
      justifyContent="center"
    >
      <Box flexDirection="column" borderStyle="double" borderColor="cyan" paddingX={3} paddingY={1}>
        <Text bold color="cyan">
          jcc-tui
        </Text>
        <Text dimColor>金铲铲终端棋盘练习</Text>
        <Text dimColor>
          弈子 {unitsCount} · 羁绊 {traitsCount}
        </Text>

        <Box flexDirection="column" marginTop={1}>
          {ITEMS.map((item, i) => {
            const focused = i === focusIndex;
            return (
              <Text key={item.id} bold={focused} inverse={focused} color={focused ? undefined : "white"}>
                {`  ${focused ? "▸" : " "} ${item.label.padEnd(8, "　")}  ${item.hint}  `}
              </Text>
            );
          })}
        </Box>

        <Box marginTop={1}>
          <Text dimColor>↑↓ 选择 · Enter 确认</Text>
        </Box>
      </Box>
    </Box>
  );
}

export const HOME_MENU_COUNT = ITEMS.length;

export function homeMenuId(index: number): HomeMenuItem {
  return ITEMS[((index % ITEMS.length) + ITEMS.length) % ITEMS.length]!.id;
}
