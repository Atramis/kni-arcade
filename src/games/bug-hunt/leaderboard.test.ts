import { beforeEach, expect, it } from "vitest";
import { readList, STORAGE_KEYS, writeList } from "@/lib/local-scores";
import { ADMIN_KEY, resetRankings } from "@/lib/admin-auth";
import { compareBug, loadBugScores, saveBugScore } from "./leaderboard";
const result = { nick: "Hunter", score: 800, hits: 8, misses: 2, mistakes: 0, bestStreak: 5 };
beforeEach(() => localStorage.clear());
it("preserves the other three games when saving Bug_Hunt", () => {
  const others = [STORAGE_KEYS.memoryLeak, STORAGE_KEYS.packetRouter, STORAGE_KEYS.stackOverflow];
  others.forEach((key) => localStorage.setItem(key, "[1]"));
  expect(STORAGE_KEYS.bugHunt).toBe("kni-arcade:bug-hunt:scores");
  expect(saveBugScore(result)).toBe(1); expect(loadBugScores()[0]).toMatchObject(result);
  others.forEach((key) => expect(localStorage.getItem(key)).toBe("[1]"));
});
it("ranks points descending and earlier timestamps first on ties", () => {
  const rows = [ { ...result, id: "late", at: 20 }, { ...result, id: "early", at: 10 }, { ...result, id: "high", at: 30, score: 900 } ];
  expect(rows.sort(compareBug).map((r) => r.id)).toEqual(["high", "early", "late"]);
});
it("keeps 200 scores, reads top 10 and reports the saved rank", () => {
  writeList(STORAGE_KEYS.bugHunt, Array.from({ length: 200 }, (_, i) => ({ ...result, id: `${i}`, score: i, at: i })));
  expect(saveBugScore(result)).toBe(1);
  expect(readList(STORAGE_KEYS.bugHunt)).toHaveLength(200); expect(loadBugScores()).toHaveLength(10);
});
it("individual reset keeps all other games, password and settings", () => {
  Object.values(STORAGE_KEYS).forEach((key) => localStorage.setItem(key, "[1]"));
  localStorage.setItem(ADMIN_KEY, "verifier"); localStorage.setItem("setting", "keep");
  resetRankings(["bugHunt"]); expect(localStorage.getItem(STORAGE_KEYS.bugHunt)).toBeNull();
  [STORAGE_KEYS.memoryLeak, STORAGE_KEYS.packetRouter, STORAGE_KEYS.stackOverflow].forEach((key) => expect(localStorage.getItem(key)).toBe("[1]"));
  expect(localStorage.getItem(ADMIN_KEY)).toBe("verifier"); expect(localStorage.getItem("setting")).toBe("keep");
});
it("all-game reset removes all four rankings, not the password", () => {
  Object.values(STORAGE_KEYS).forEach((key) => localStorage.setItem(key, "[1]")); localStorage.setItem(ADMIN_KEY, "keep");
  resetRankings(["memoryLeak", "packetRouter", "stackOverflow", "bugHunt"]);
  Object.values(STORAGE_KEYS).forEach((key) => expect(localStorage.getItem(key)).toBeNull());
  expect(localStorage.getItem(ADMIN_KEY)).toBe("keep");
});