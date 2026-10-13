import { STORAGE_KEYS, readList, writeList } from "@/lib/local-scores";

export type Entry = { nick: string; score: number; at: number };

/** Points desc; on a tie the earlier result ranks higher. */
export const comparePacket = (a: Entry, b: Entry) => b.score - a.score || a.at - b.at;

export function loadScores(): Entry[] {
  return readList<Entry>(STORAGE_KEYS.packetRouter).sort(comparePacket).slice(0, 10);
}

export function saveScore(e: Entry): Entry[] {
  const all = [...readList<Entry>(STORAGE_KEYS.packetRouter), e].sort(comparePacket).slice(0, 50);
  writeList(STORAGE_KEYS.packetRouter, all);
  return all.slice(0, 10);
}
