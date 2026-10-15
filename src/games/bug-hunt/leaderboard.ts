import { newId, readList, STORAGE_KEYS, writeList } from "@/lib/local-scores";
export type BugEntry = { id: string; nick: string; score: number; hits: number; misses: number; mistakes: number; bestStreak: number; at: number };
export const compareBug = (a: BugEntry, b: BugEntry) => b.score - a.score || a.at - b.at;
export const loadBugScores = () => readList<BugEntry>(STORAGE_KEYS.bugHunt).sort(compareBug).slice(0, 10);
export function saveBugScore(entry: Omit<BugEntry, "id" | "at">) {
  const row = { ...entry, id: newId(), at: Date.now() };
  const scores = [...readList<BugEntry>(STORAGE_KEYS.bugHunt), row].sort(compareBug).slice(0, 200);
  writeList(STORAGE_KEYS.bugHunt, scores);
  return scores.findIndex((r) => r.id === row.id) + 1;
}