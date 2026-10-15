import { newId, readList, STORAGE_KEYS, writeList } from "@/lib/local-scores";

export type StackEntry = { id: string; nick: string; score: number; lines: number; at: number };
export const compareStack = (a: StackEntry, b: StackEntry) => b.score - a.score || a.at - b.at;
export function loadStackScores() {
  return readList<StackEntry>(STORAGE_KEYS.stackOverflow).sort(compareStack).slice(0, 10);
}
export function saveStackScore(entry: Pick<StackEntry, "nick" | "score" | "lines">) {
  const row = { ...entry, id: newId(), at: Date.now() };
  const scores = [...readList<StackEntry>(STORAGE_KEYS.stackOverflow), row].sort(compareStack).slice(0, 200);
  writeList(STORAGE_KEYS.stackOverflow, scores);
  return scores.findIndex((r) => r.id === row.id) + 1;
}