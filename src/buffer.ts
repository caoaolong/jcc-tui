import { BRICKS, brickToRect, type BrickCell } from "./brick.js";
import { charDisplayWidth, displayWidth, truncateToDisplayWidth } from "./textWidth.js";

export type Cell = {
  ch: string;
  color?: string;
  bold?: boolean;
  /** 宽字符占位续格，渲染时跳过 */
  skip?: boolean;
};

export type Frame = {
  width: number;
  height: number;
  rows: Cell[][];
};

const EMPTY: Cell = { ch: " " };
const PADDING = 1;

type BoxChars = {
  tl: string;
  tr: string;
  bl: string;
  br: string;
  h: string;
  v: string;
};

const BOX_NORMAL: BoxChars = {
  tl: "┌",
  tr: "┐",
  bl: "└",
  br: "┘",
  h: "─",
  v: "│",
};

const BOX_FOCUS: BoxChars = {
  tl: "╔",
  tr: "╗",
  bl: "╚",
  br: "╝",
  h: "═",
  v: "║",
};

export type LabelMap = Record<string, string>;

/**
 * 砖墙式交错矩形：只画边框；标签优先用选中的棋子名。
 */
export function renderBrickBuffer(focusedId: string | null, labels: LabelMap = {}): Frame {
  const placed = BRICKS.map((brick) => ({
    brick,
    rect: brickToRect(brick.col, brick.row),
  }));

  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;
  for (const { rect } of placed) {
    minX = Math.min(minX, rect.x);
    maxX = Math.max(maxX, rect.x + rect.w);
    minY = Math.min(minY, rect.y);
    maxY = Math.max(maxY, rect.y + rect.h);
  }

  const originX = Math.floor(minX) - PADDING;
  const originY = Math.floor(minY) - PADDING;
  const width = Math.ceil(maxX - minX) + PADDING * 2;
  const height = Math.ceil(maxY - minY) + PADDING * 2;

  const rows: Cell[][] = Array.from({ length: height }, () =>
    Array.from({ length: width }, () => ({ ...EMPTY })),
  );

  const put = (col: number, row: number, cell: Cell) => {
    if (row < 0 || row >= height || col < 0 || col >= width) return;
    rows[row]![col] = cell;
  };

  const paintRect = (brick: BrickCell, x: number, y: number, w: number, h: number) => {
    const focused = brick.id === focusedId;
    const color = focused ? brick.focusColor : brick.color;
    const box = focused ? BOX_FOCUS : BOX_NORMAL;
    const ox = x - originX;
    const oy = y - originY;

    put(ox, oy, { ch: box.tl, color, bold: focused });
    put(ox + w - 1, oy, { ch: box.tr, color, bold: focused });
    put(ox, oy + h - 1, { ch: box.bl, color, bold: focused });
    put(ox + w - 1, oy + h - 1, { ch: box.br, color, bold: focused });
    for (let dx = 1; dx < w - 1; dx++) {
      put(ox + dx, oy, { ch: box.h, color, bold: focused });
      put(ox + dx, oy + h - 1, { ch: box.h, color, bold: focused });
    }

    for (let dy = 1; dy < h - 1; dy++) {
      put(ox, oy + dy, { ch: box.v, color, bold: focused });
      put(ox + w - 1, oy + dy, { ch: box.v, color, bold: focused });
    }

    const innerWidth = w - 2;
    const raw = labels[brick.id]?.trim() || "";
    const label = truncateToDisplayWidth(raw, innerWidth);
    if (!label) return;

    const midRow = oy + Math.floor(h / 2);
    const lw = displayWidth(label);
    let col = ox + 1 + Math.max(0, Math.floor((innerWidth - lw) / 2));
    for (const ch of label) {
      put(col, midRow, { ch, color, bold: focused });
      const cw = charDisplayWidth(ch);
      for (let k = 1; k < cw; k++) {
        put(col + k, midRow, { ch: "", skip: true });
      }
      col += cw;
      if (col >= ox + w - 1) break;
    }
  };

  for (const { brick, rect } of placed) {
    paintRect(brick, rect.x, rect.y, rect.w, rect.h);
  }

  return { width, height, rows };
}
