import { STORAGE_KEYS, newId, readList, writeList } from "@/lib/local-scores";
import { withPlaces } from "./engine";

export type MemoryEntry = { id: string; nick: string; level: number; errors: number; time_ms: number | null; at: number };

/** Sorted: level desc, errors asc, time asc; identical results share a place. */
export function loadMemoryScores() {
  return withPlaces(readList<MemoryEntry>(STORAGE_KEYS.memoryLeak));
}

export function saveMemoryScore(e: Omit<MemoryEntry, "id" | "at">): { id: string; rank: number } {
  const entry: MemoryEntry = { ...e, id: newId(), at: Date.now() };
  const all = [...readList<MemoryEntry>(STORAGE_KEYS.memoryLeak), entry];
  const ranked = withPlaces(all).slice(0, 200);
  writeList(STORAGE_KEYS.memoryLeak, ranked.map(({ place: _p, ...r }) => r));
  const rank = ranked.find((r) => r.id === entry.id)?.place ?? ranked.length + 1;
  return { id: entry.id, rank };
}
