import { describe, expect, it } from "vitest";
import { BugGame, stageAt } from "./engine";

function playing() { const game = new BugGame(() => 0); game.start(0); game.tick(3000); return game; }
function hitFirst(game: BugGame, kind: "bug" | "healthy", now = 3000) {
  const target = game.snapshot().targets.find((t) => t.kind === kind);
  if (!target) throw new Error(`Missing ${kind}`);
  game.hit(target.cell, target.id, now); return target;
}
describe("Bug_Hunt rules", () => {
  it("starts after exactly a three-second countdown", () => {
    const game = new BugGame(); game.start(100); game.tick(3099);
    expect(game.snapshot()).toMatchObject({ phase: "countdown", countdown: 1, remainingMs: 60000 });
    game.tick(3100); expect(game.snapshot().phase).toBe("playing");
  });
  it("ends after 60 seconds excluding countdown", () => {
    const game = playing(); game.tick(62999); expect(game.snapshot().phase).toBe("playing");
    game.tick(63000); expect(game.snapshot()).toMatchObject({ phase: "finished", reason: "time", remainingMs: 0 });
  });
  it("awards exactly 100 points per bug, never twice", () => {
    const game = playing(); const target = hitFirst(game, "bug"); game.hit(target.cell, target.id, 3001);
    expect(game.snapshot()).toMatchObject({ score: 100, hits: 1, streak: 1, bestStreak: 1 });
  });
  it("subtracts exactly 50 points for a healthy symbol", () => {
    const game = playing(); hitFirst(game, "bug"); hitFirst(game, "healthy");
    expect(game.snapshot()).toMatchObject({ score: 50, mistakes: 1, streak: 0, bestStreak: 1 });
  });
  it("never lets the score drop below zero", () => {
    const game = playing(); hitFirst(game, "healthy"); expect(game.snapshot().score).toBe(0);
  });
  it("a missed bug scores zero and breaks the streak", () => {
    const game = playing(); hitFirst(game, "bug"); game.tick(3600); game.tick(5000);
    expect(game.snapshot()).toMatchObject({ score: 100, hits: 1, misses: 1, streak: 0, bestStreak: 1 });
  });
  it("allows a hit up to expiry, not at or after expiry", () => {
    const game = playing(); hitFirst(game, "bug", 4399); expect(game.snapshot().hits).toBe(1);
    const other = playing(); hitFirst(other, "bug", 4400);
    expect(other.snapshot()).toMatchObject({ hits: 0, misses: 1, score: 0 });
  });
  it.each([[0, 0], [14999, 0], [15000, 1], [30000, 2], [45000, 3]])("uses stage %i → %i", (elapsed, stage) => {
    expect(stageAt(elapsed)).toBe(stage);
  });
  it("uses lifetimes 1400, 1300, 1100 and 800 ms at successive stages", () => {
    const game = playing(); const seen = new Map<number, number>(); const durations = new Set<number>();
    for (let now = 3000; now <= 63000; now += 10) {
      game.tick(now);
      for (const target of game.snapshot().targets) if (!seen.has(target.id)) {
        seen.set(target.id, now); durations.add(target.expiresAt - now);
        expect(target.expiresAt).toBeLessThanOrEqual(63000);
      }
    }
    expect([...durations].sort((a, b) => a - b)).toEqual([800, 1100, 1300, 1400]);
  });
  it("has at most three bugs, unique cells and no out-of-grid targets", () => {
    const game = playing(); let max = 0;
    for (let now = 3000; now <= 63000; now += 100) {
      game.tick(now); const targets = game.snapshot().targets;
      max = Math.max(max, targets.filter((t) => t.kind === "bug").length);
      expect(new Set(targets.map((t) => t.cell)).size).toBe(targets.length);
      expect(targets.every((t) => t.cell >= 0 && t.cell < 16)).toBe(true);
    }
    expect(max).toBe(3);
  });
  it("ignores stale target IDs after the same cell is reused", () => {
    const game = playing(); const old = hitFirst(game, "bug"); game.tick(3600);
    game.hit(old.cell, old.id, 3600); expect(game.snapshot().hits).toBe(1);
  });
  it.each([0, 3000])("interruption at %i stops input and clocks", (now) => {
    const game = new BugGame(); game.start(0); game.tick(now); game.abort();
    const before = game.snapshot(); game.tick(100000); game.hit(0, 1, 100000);
    expect(game.snapshot()).toEqual(before); expect(before.reason).toBe("aborted");
  });
  it("replay resets counters and countdown", () => {
    const game = playing(); hitFirst(game, "bug"); game.abort(); game.start(9000);
    expect(game.snapshot()).toMatchObject({ phase: "countdown", score: 0, hits: 0, misses: 0, mistakes: 0, bestStreak: 0, targets: [] });
  });
});