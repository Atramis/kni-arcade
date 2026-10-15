import { describe, expect, it, vi } from "vitest";
import { BOARD_HEIGHT, BOARD_WIDTH, PIECE_KINDS, getGhostCells, getPieceCells, type Cell, type Engine } from "tetris-toolkit";
import { COUNTDOWN_MS, HEIGHT, ROUND_MS, StackGame, WIDTH, fallInterval, pointsForRows } from "./engine";

describe("Stack_Overflow booth rules", () => {
  it("has a 10 by 20 visible board and seven shapes", () => {
    expect([WIDTH, HEIGHT]).toEqual([10, 20]);
    expect(PIECE_KINDS).toHaveLength(7);
  });
  it.each([[1, 100], [2, 300], [3, 500], [4, 800]])("awards %i rows exactly %i points", (rows, points) => {
    expect(pointsForRows(rows)).toBe(points);
  });
  it("speeds up every five rows and never below 100 ms", () => {
    expect(fallInterval(0)).toBe(800); expect(fallInterval(4)).toBe(800);
    expect(fallInterval(5)).toBe(720); expect(fallInterval(10)).toBe(640);
    expect(fallInterval(1000)).toBe(100);
  });
  it("ends after exactly 120 seconds excluding countdown", () => {
    expect(ROUND_MS).toBe(120000);
    const game = new StackGame(); game.start(42); game.tick(COUNTDOWN_MS);
    // Isolate the wall clock from natural idle-play overflow, tested separately below.
    const core = (game as unknown as { core: Engine }).core;
    const tick = vi.spyOn(core, "tick").mockImplementation(() => {});
    game.tick(119999); expect(game.snapshot().phase).toBe("playing");
    game.tick(1); expect(game.snapshot()).toMatchObject({ phase: "finished", reason: "time", remainingMs: 0 });
    expect(tick.mock.calls.reduce((sum, [ms]) => sum + ms, 0)).toBe(120000);
    game.destroy();
  });
  it("does not award movement, rotation or drop points", () => {
    const game = new StackGame(); game.start(42); game.tick(COUNTDOWN_MS);
    game.press("left"); game.release("left"); game.press("rotate");
    game.press("down"); game.tick(100); game.release("down"); game.press("drop");
    expect(game.snapshot().score).toBe(0); game.destroy();
  });
  it("clears a row using the library and awards only 100 points", () => {
    const game = new StackGame(); game.start(42); game.tick(COUNTDOWN_MS);
    const ghost = getGhostCells(game.snapshot().board);
    const bottom = Math.max(...ghost.map(([, y]) => y));
    const holes = new Set(ghost.filter(([, y]) => y === bottom).map(([x]) => x));
    const board: Cell[][] = Array.from({ length: BOARD_HEIGHT }, () => Array<Cell>(BOARD_WIDTH).fill(null));
    board[BOARD_HEIGHT - 1] = Array.from({ length: BOARD_WIDTH }, (_, x) => holes.has(x) ? null : "J");
    game.start(42, board); game.tick(COUNTDOWN_MS); game.press("drop"); game.tick(600);
    expect(game.snapshot()).toMatchObject({ score: 100, lines: 1 }); game.destroy();
  });
  it("prevents pieces moving beyond the left boundary and supports rotation", () => {
    const game = new StackGame(); game.start(42); game.tick(COUNTDOWN_MS);
    const before = game.snapshot().board.active;
    game.press("rotate"); expect(game.snapshot().board.active?.rotation).not.toBe(before?.rotation);
    game.press("left"); game.tick(1500); game.release("left");
    const active = game.snapshot().board.active;
    expect(active).not.toBeNull();
    if (!active) throw new Error("Expected active piece");
    expect(Math.min(...getPieceCells(active.kind, active.rotation, active.x, active.y).map(([x]) => x))).toBe(0);
    game.destroy();
  });
  it("ends on overflow and replay starts a fresh run", () => {
    const game = new StackGame(); game.start(42); game.tick(COUNTDOWN_MS);
    for (let i = 0; i < 30 && game.snapshot().phase === "playing"; i++) { game.press("drop"); game.tick(32); }
    expect(game.snapshot()).toMatchObject({ phase: "finished", reason: "overflow" });
    game.start(43); expect(game.snapshot()).toMatchObject({ phase: "countdown", score: 0, lines: 0, remainingMs: 120000 });
    game.destroy();
  });
  it("aborted attempts stop accepting input and time", () => {
    const game = new StackGame(); game.start(42); game.tick(COUNTDOWN_MS); game.abort();
    const before = game.snapshot(); game.press("drop"); game.tick(5000);
    expect(game.snapshot()).toEqual(before); expect(before.reason).toBe("aborted"); game.destroy();
  });
});