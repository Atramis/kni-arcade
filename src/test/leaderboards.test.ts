import { beforeEach, describe, expect, it } from "vitest";
import { STORAGE_KEYS } from "@/lib/local-scores";
import { loadMemoryScores, saveMemoryScore } from "@/games/memory-leak/leaderboard";
import { loadScores, saveScore } from "@/games/packet-router/leaderboard";

beforeEach(() => localStorage.clear());

describe("separate local leaderboards", () => {
  it("stores each game under its own key", () => {
    saveMemoryScore({ nick: "Ala", level: 3, errors: 1, time_ms: 9000 });
    saveScore({ nick: "Bob", score: 250, at: 1 });
    expect(loadMemoryScores().map((r) => r.nick)).toEqual(["Ala"]);
    expect(loadScores().map((r) => r.nick)).toEqual(["Bob"]);
    expect(localStorage.getItem(STORAGE_KEYS.memoryLeak)).toContain("Ala");
    expect(localStorage.getItem(STORAGE_KEYS.packetRouter)).not.toContain("Ala");
  });

  it("Memory Leak sorts by level desc, then errors asc, then time asc", () => {
    saveMemoryScore({ nick: "slow", level: 5, errors: 0, time_ms: 30000 });
    saveMemoryScore({ nick: "fast", level: 5, errors: 0, time_ms: 20000 });
    saveMemoryScore({ nick: "sloppy", level: 5, errors: 2, time_ms: 10000 });
    saveMemoryScore({ nick: "top", level: 7, errors: 2, time_ms: 50000 });
    expect(loadMemoryScores().map((r) => r.nick)).toEqual(["top", "fast", "slow", "sloppy"]);
  });

  it("Memory Leak returns the saved place", () => {
    saveMemoryScore({ nick: "a", level: 8, errors: 0, time_ms: 1000 });
    expect(saveMemoryScore({ nick: "b", level: 2, errors: 0, time_ms: 1000 }).rank).toBe(2);
  });

  it("Packet Router sorts by points desc and keeps top 10", () => {
    for (let i = 0; i < 12; i++) saveScore({ nick: `p${i}`, score: i * 10, at: i });
    const top = loadScores();
    expect(top).toHaveLength(10);
    expect(top[0]!.score).toBe(110);
    expect(top[9]!.score).toBe(20);
  });
});
