/** 砖块网格坐标：row 为砖行，奇数行整体半宽错位 */
export type BrickCoord = { col: number; row: number };

export type BrickCell = BrickCoord & {
  id: string;
  color: string;
  focusColor: string;
};

export const GRID_ROWS = 4;
export const GRID_COLS = 7;

/** 每块砖固定占 3 行终端行 */
export const RECT_HEIGHT = 3;
/** 砖块宽度（字符列数） */
export const RECT_WIDTH = 10;

/** 前两排 / 后两排各用一种颜色 */
const FRONT = { color: "cyan", focusColor: "white" };
const BACK = { color: "yellow", focusColor: "white" };

/** 4 行 × 7 列砖墙：偶数行左对齐，奇数行右错半块 */
export const BRICKS: BrickCell[] = [];
for (let row = 0; row < GRID_ROWS; row++) {
  for (let col = 0; col < GRID_COLS; col++) {
    const tone = row < 2 ? FRONT : BACK;
    BRICKS.push({
      id: `${row},${col}`,
      col,
      row,
      color: tone.color,
      focusColor: tone.focusColor,
    });
  }
}

export type BrickRect = {
  x: number;
  y: number;
  w: number;
  h: number;
};

/** 砖块坐标 → 屏幕矩形（奇数行右移半宽，形成砖墙交错） */
export function brickToRect(col: number, row: number): BrickRect {
  const x = col * RECT_WIDTH + (row & 1 ? RECT_WIDTH / 2 : 0);
  const y = row * RECT_HEIGHT;
  return { x, y, w: RECT_WIDTH, h: RECT_HEIGHT };
}

export type Direction = "up" | "down" | "left" | "right";

/** 砖墙邻格：左右同行；上下优先同列，没有再试交错侧的邻居 */
export function neighborCandidates(from: BrickCoord, direction: Direction): BrickCoord[] {
  const { col, row } = from;
  switch (direction) {
    case "left":
      return [{ col: col - 1, row }];
    case "right":
      return [{ col: col + 1, row }];
    case "up":
      return row & 1
        ? [
            { col, row: row - 1 },
            { col: col + 1, row: row - 1 },
          ]
        : [
            { col, row: row - 1 },
            { col: col - 1, row: row - 1 },
          ];
    case "down":
      return row & 1
        ? [
            { col, row: row + 1 },
            { col: col + 1, row: row + 1 },
          ]
        : [
            { col, row: row + 1 },
            { col: col - 1, row: row + 1 },
          ];
  }
}

export function brickKey(col: number, row: number): string {
  return `${col},${row}`;
}
