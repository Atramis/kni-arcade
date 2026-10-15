import { beforeEach, expect, it } from "vitest";
import { readList, STORAGE_KEYS, writeList } from "@/lib/local-scores";
import { ADMIN_KEY, resetRankings } from "@/lib/admin-auth";
import { compareStack, loadStackScores, saveStackScore, type StackEntry } from "./leaderboard";

beforeEach(() => localStorage.clear());
it("stores Stack_Overflow independently and survives a fresh read", () => {
  localStorage.setItem(STORAGE_KEYS.memoryLeak, "[1]"); localStorage.setItem(STORAGE_KEYS.packetRouter, "[2]");
  expect(saveStackScore({ nick: "Player", score: 800, lines: 4 })).toBe(1);
  expect(loadStackScores()[0]).toMatchObject({ nick: "Player", score: 800 });
  expect(localStorage.getItem(STORAGE_KEYS.memoryLeak)).toBe("[1]");
  expect(localStorage.getItem(STORAGE_KEYS.packetRouter)).toBe("[2]");
});
it("sorts by points descending, then earlier save time", () => {
  const rows: StackEntry[] = [
    { id: "a", nick: "late", score: 300, lines: 2, at: 2 },
    { id: "b", nick: "early", score: 300, lines: 2, at: 1 },
    { id: "c", nick: "top", score: 800, lines: 4, at: 3 },
  ];
  expect(rows.sort(compareStack).map((r) => r.nick)).toEqual(["top", "early", "late"]);
});
it("retains 200 scores but displays 10", () => {
  writeList(STORAGE_KEYS.stackOverflow, Array.from({ length: 200 }, (_, i) => ({ id: `${i}`, nick: `p${i}`, score: i, lines: 0, at: i })));
  saveStackScore({ nick: "winner", score: 1000, lines: 20 });
  expect(readList(STORAGE_KEYS.stackOverflow)).toHaveLength(200); expect(loadStackScores()).toHaveLength(10);
});
it("individual and all-game reset preserve the password and unrelated settings", () => {
  localStorage.setItem(ADMIN_KEY, "verifier"); localStorage.setItem("settings", "keep");
  Object.values(STORAGE_KEYS).forEach((key) => localStorage.setItem(key, "[1]"));
  resetRankings(["stackOverflow"]);
  expect(localStorage.getItem(STORAGE_KEYS.stackOverflow)).toBeNull();
  expect(localStorage.getItem(STORAGE_KEYS.memoryLeak)).toBe("[1]");
  expect(localStorage.getItem(STORAGE_KEYS.packetRouter)).toBe("[1]");
  localStorage.setItem(STORAGE_KEYS.stackOverflow, "[2]");
  resetRankings(["memoryLeak", "packetRouter", "stackOverflow"]);
  Object.values(STORAGE_KEYS).forEach((key) => expect(localStorage.getItem(key)).toBeNull());
  expect(localStorage.getItem(ADMIN_KEY)).toBe("verifier"); expect(localStorage.getItem("settings")).toBe("keep");
});