import React from "react";
import { Box, useStdout } from "ink";

type Props = {
  children: React.ReactNode;
};

/**
 * 全屏居中层：占满终端，把子弹居中（不逐行铺黑底，避免 Ink 布局崩溃）。
 */
export function ModalOverlay({ children }: Props) {
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
      {children}
    </Box>
  );
}
