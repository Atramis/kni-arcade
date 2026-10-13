export const GRID_SIZE = 5;
export const CELL_COUNT = GRID_SIZE * GRID_SIZE;
export const MAX_LEVEL = 10;
export const START_LIVES = 3;
export const GAME_DURATION_MS = 60_000;
/** Seconds added to the clock for each solved puzzle (capped at GAME_DURATION_MS remaining). */
export const TIME_BONUS_MS = 4_000;
export const MEMORIZE_MS = 2_000;
export const SUCCESS_MS = 600;
export const FAIL_MS = 1_000;
export const RULES_VERSION = "v2";

export const cellsForLevel = (level: number) => level + 2;

/** Unbiased sample of `count` distinct cell indexes (partial Fisher–Yates). */
export function randomPattern(count: number, rand: () => number = Math.random): Set<number> {
  const cells = Array.from({ length: CELL_COUNT }, (_, i) => i);
  for (let i = 0; i < count; i++) {
    const j = i + Math.floor(rand() * (CELL_COUNT - i));
    const tmp = cells[i]!;
    cells[i] = cells[j]!;
    cells[j] = tmp;
  }
  return new Set(cells.slice(0, count));
}

export interface ScoreLike {
  level: number;
  errors: number;
  time_ms: number | null;
}

/** Negative if a ranks above b. Level desc, errors asc, time asc. */
export function compareScores(a: ScoreLike, b: ScoreLike): number {
  if (a.level !== b.level) return b.level - a.level;
  if (a.errors !== b.errors) return a.errors - b.errors;
  const ta = a.time_ms ?? Number.MAX_SAFE_INTEGER;
  const tb = b.time_ms ?? Number.MAX_SAFE_INTEGER;
  return ta - tb;
}

/** Competition ranking: identical results share a place (1,1,3). */
export function withPlaces<T extends ScoreLike>(rows: T[]): (T & { place: number })[] {
  const sorted = [...rows].sort(compareScores);
  let place = 0;
  return sorted.map((r, i) => {
    if (i === 0 || compareScores(sorted[i - 1]!, r) !== 0) place = i + 1;
    return { ...r, place };
  });
}

export function validateNick(raw: string): string | null {
  const nick = raw.trim();
  const len = [...nick].length;
  if (len < 2 || len > 20) return null;
  return nick;
}

export function formatMs(ms: number | null): string {
  if (ms == null) return "—";
  return `${(ms / 1000).toFixed(2)} s`;
}
