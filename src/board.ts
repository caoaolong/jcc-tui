/** 棋子星级：1 / 2 / 3 */
export type Star = 1 | 2 | 3;

export type BoardPiece = {
  name: string;
  stars: Star;
};

/** 格子 id → 棋子（含星级） */
export type BoardMap = Record<string, BoardPiece | undefined>;

export const BENCH_SIZE = 9;
export type BenchSlots = Array<BoardPiece | null>;

export function createEmptyBench(): BenchSlots {
  return Array.from({ length: BENCH_SIZE }, () => null);
}

type PieceLoc =
  | { kind: "board"; id: string }
  | { kind: "bench"; index: number };

function locKey(loc: PieceLoc): string {
  return loc.kind === "board" ? `board:${loc.id}` : `bench:${loc.index}`;
}

function parseLocKey(key: string): PieceLoc {
  if (key.startsWith("board:")) return { kind: "board", id: key.slice(6) };
  return { kind: "bench", index: Number(key.slice(6)) };
}

/** 仅名称映射（羁绊统计等）——棋盘 */
export function boardToLabels(board: BoardMap): Record<string, string> {
  const labels: Record<string, string> = {};
  for (const [id, piece] of Object.entries(board)) {
    if (piece?.name) labels[id] = piece.name;
  }
  return labels;
}

/** 棋盘 + 备战席上的同名棋子（去重，用于羁绊） */
export function uniqueNamesOnField(board: BoardMap, bench: BenchSlots): Set<string> {
  const names = new Set<string>();
  for (const piece of Object.values(board)) {
    if (piece?.name) names.add(piece.name);
  }
  for (const piece of bench) {
    if (piece?.name) names.add(piece.name);
  }
  return names;
}

function readPiece(board: BoardMap, bench: BenchSlots, loc: PieceLoc): BoardPiece | null {
  if (loc.kind === "board") return board[loc.id] ?? null;
  return bench[loc.index] ?? null;
}

function writePiece(
  board: BoardMap,
  bench: BenchSlots,
  loc: PieceLoc,
  piece: BoardPiece | null,
): { board: BoardMap; bench: BenchSlots } {
  if (loc.kind === "board") {
    const nextBoard = { ...board };
    if (piece) nextBoard[loc.id] = piece;
    else delete nextBoard[loc.id];
    return { board: nextBoard, bench };
  }
  const nextBench = [...bench];
  nextBench[loc.index] = piece;
  return { board, bench: nextBench };
}

/**
 * 棋盘 + 备战席一起合成：同名同星满 3 → 升星。
 */
export function autoCombineField(
  board: BoardMap,
  bench: BenchSlots,
  prefer?: PieceLoc,
): { board: BoardMap; bench: BenchSlots } {
  let currentBoard = { ...board };
  let currentBench: BenchSlots = [...bench];
  let changed = true;
  const preferKey = prefer ? locKey(prefer) : null;

  while (changed) {
    changed = false;
    const groups = new Map<string, string[]>();

    for (const [id, piece] of Object.entries(currentBoard)) {
      if (!piece || piece.stars >= 3) continue;
      const key = `${piece.name}\0${piece.stars}`;
      const list = groups.get(key) ?? [];
      list.push(locKey({ kind: "board", id }));
      groups.set(key, list);
    }
    for (let i = 0; i < currentBench.length; i++) {
      const piece = currentBench[i];
      if (!piece || piece.stars >= 3) continue;
      const key = `${piece.name}\0${piece.stars}`;
      const list = groups.get(key) ?? [];
      list.push(locKey({ kind: "bench", index: i }));
      groups.set(key, list);
    }

    for (const [groupKey, ids] of groups) {
      if (ids.length < 3) continue;
      const sep = groupKey.indexOf("\0");
      const name = groupKey.slice(0, sep);
      const stars = Number(groupKey.slice(sep + 1)) as Star;
      const nextStars = (stars + 1) as Star;

      const ordered = [...ids];
      if (preferKey && ordered.includes(preferKey)) {
        ordered.splice(ordered.indexOf(preferKey), 1);
        ordered.unshift(preferKey);
      }
      const trio = ordered.slice(0, 3);
      const keep = parseLocKey(trio[0]!);

      for (const id of trio) {
        const loc = parseLocKey(id);
        if (locKey(loc) === locKey(keep)) continue;
        const written = writePiece(currentBoard, currentBench, loc, null);
        currentBoard = written.board;
        currentBench = written.bench;
      }
      const written = writePiece(currentBoard, currentBench, keep, { name, stars: nextStars });
      currentBoard = written.board;
      currentBench = written.bench;
      changed = true;
      break;
    }
  }

  return { board: currentBoard, bench: currentBench };
}

/** 购买：放入备战席第一个空位并合成 */
export function buyToBench(
  board: BoardMap,
  bench: BenchSlots,
  name: string,
): { board: BoardMap; bench: BenchSlots; ok: boolean; index: number } {
  const index = bench.findIndex((p) => p === null);
  if (index < 0) return { board, bench, ok: false, index: -1 };
  const nextBench = [...bench];
  nextBench[index] = { name, stars: 1 };
  const combined = autoCombineField(board, nextBench, { kind: "bench", index });
  return { ...combined, ok: true, index };
}

/** 将棋盘指定格放置 1 星并合成（选棋调试用） */
export function placeOnBoard(
  board: BoardMap,
  bench: BenchSlots,
  brickId: string,
  name: string,
): { board: BoardMap; bench: BenchSlots } {
  const nextBoard: BoardMap = {
    ...board,
    [brickId]: { name, stars: 1 },
  };
  return autoCombineField(nextBoard, bench, { kind: "board", id: brickId });
}

/** 备战席 → 棋盘焦点格（覆盖原格，并合成） */
export function deployBenchToBoard(
  board: BoardMap,
  bench: BenchSlots,
  benchIndex: number,
  brickId: string,
): { board: BoardMap; bench: BenchSlots; ok: boolean } {
  const piece = bench[benchIndex];
  if (!piece) return { board, bench, ok: false };
  const nextBench = [...bench];
  nextBench[benchIndex] = null;
  const nextBoard: BoardMap = { ...board, [brickId]: piece };
  const combined = autoCombineField(nextBoard, nextBench, { kind: "board", id: brickId });
  return { ...combined, ok: true };
}

/** 出售备战席指定栏（清空，不回池） */
export function sellFromBench(
  bench: BenchSlots,
  benchIndex: number,
): { bench: BenchSlots; ok: boolean; piece: BoardPiece | null } {
  if (benchIndex < 0 || benchIndex >= BENCH_SIZE) {
    return { bench, ok: false, piece: null };
  }
  const piece = bench[benchIndex] ?? null;
  if (!piece) return { bench, ok: false, piece: null };
  const nextBench = [...bench];
  nextBench[benchIndex] = null;
  return { bench: nextBench, ok: true, piece };
}
