// Pure game logic for Packet Router. Directions as bitmask: N=1, E=2, S=4, W=8.
export const N = 1, E = 2, S = 4, W = 8;
export const SIZE = 5;
export const ROUND_SECONDS = 120;
export const TIME_BONUS = 10;
export const BASE_POINTS = 100;
export const STREAK_BONUS = 25;
export const FAIL_PENALTY = 30;

export type Puzzle = { tiles: number[]; source: number; target: number; level: number };

export const rotate = (m: number) => ((m << 1) | (m >> 3)) & 15;
const opposite = (d: number) => (d === N ? S : d === S ? N : d === E ? W : E);
const step = (i: number, d: number): number | null => {
  const r = Math.floor(i / SIZE), c = i % SIZE;
  if (d === N) return r > 0 ? i - SIZE : null;
  if (d === S) return r < SIZE - 1 ? i + SIZE : null;
  if (d === E) return c < SIZE - 1 ? i + 1 : null;
  return c > 0 ? i - 1 : null;
};

/** Returns the cell path from source to target if connected, otherwise null. */
export function findRoute(p: Pick<Puzzle, "tiles" | "source" | "target">): number[] | null {
  const startRow = p.source, endRow = p.target;
  const start = startRow * SIZE;
  if (!(p.tiles[start]! & W)) return null;
  const parent = new Map<number, number>([[start, -1]]);
  const queue = [start];
  while (queue.length) {
    const cur = queue.shift()!;
    if (cur === endRow * SIZE + SIZE - 1 && p.tiles[cur]! & E) {
      const path = [];
      for (let x = cur; x !== -1; x = parent.get(x)!) path.unshift(x);
      return path;
    }
    for (const d of [N, E, S, W]) {
      if (!(p.tiles[cur]! & d)) continue;
      const nx = step(cur, d);
      if (nx === null || parent.has(nx) || !(p.tiles[nx]! & opposite(d))) continue;
      parent.set(nx, cur);
      queue.push(nx);
    }
  }
  return null;
}

const shuffle = <T,>(a: T[]) => { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j]!, a[i]!]; } return a; };

function randomPath(startRow: number, endRow: number, minLen: number): number[] | null {
  const start = startRow * SIZE, end = endRow * SIZE + SIZE - 1;
  const visited = new Set<number>([start]);
  const path = [start];
  let budget = 4000;
  const dfs = (cur: number): boolean => {
    if (--budget < 0) return false;
    if (cur === end) return path.length >= minLen;
    for (const d of shuffle([N, E, S, W])) {
      const nx = step(cur, d);
      if (nx === null || visited.has(nx)) continue;
      visited.add(nx); path.push(nx);
      if (dfs(nx)) return true;
      visited.delete(nx); path.pop();
    }
    return false;
  };
  return dfs(start) ? path : null;
}

const dirBetween = (a: number, b: number) => (b === a - SIZE ? N : b === a + SIZE ? S : b === a + 1 ? E : W);

export function generatePuzzle(level: number): Puzzle {
  const minLen = Math.min(5 + level, 13);
  for (;;) {
    const source = Math.floor(Math.random() * SIZE);
    const target = Math.floor(Math.random() * SIZE);
    const path = randomPath(source, target, minLen);
    if (!path) continue;
    const tiles = Array.from({ length: SIZE * SIZE }, () => [5, 10, 3, 6, 12, 9][Math.floor(Math.random() * 6)]!);
    path.forEach((cell, k) => {
      const inD = k === 0 ? W : opposite(dirBetween(path[k - 1]!, cell));
      const outD = k === path.length - 1 ? E : dirBetween(cell, path[k + 1]!);
      tiles[cell] = inD | outD;
    });
    // Scramble rotations; ensure the puzzle doesn't start solved.
    const scrambled = tiles.map((t) => { let m = t!; const n = Math.floor(Math.random() * 4); for (let i = 0; i < n; i++) m = rotate(m); return m; });
    const puzzle = { tiles: scrambled, source, target, level };
    if (!findRoute(puzzle)) return puzzle;
  }
}

export function scoreSuccess(score: number, streak: number) {
  return { score: score + BASE_POINTS + STREAK_BONUS * streak, streak: streak + 1 };
}
export function scoreFail(score: number) {
  return { score: Math.max(0, score - FAIL_PENALTY), streak: 0 };
}

export function validateNick(raw: string): string | null {
  const nick = raw.trim().replace(/\s+/g, " ");
  return nick.length >= 2 && nick.length <= 16 ? nick : null;
}
