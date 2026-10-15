import { createEngine, type GameState, type Playfield } from "tetris-toolkit";

export const ROUND_MS = 120_000;
export const COUNTDOWN_MS = 3_000;
export const WIDTH = 10;
export const HEIGHT = 20;
export const pointsForRows = (rows: number) => [0, 100, 300, 500, 800][rows] ?? 0;
export const fallInterval = (lines: number) => Math.max(100, 800 - Math.floor(lines / 5) * 80);
export type Action = "left" | "right" | "down" | "rotate" | "drop";
export type StackPhase = "start" | "countdown" | "playing" | "finished";
export type StackView = {
  phase: StackPhase; reason: "time" | "overflow" | "aborted" | null;
  score: number; lines: number; remainingMs: number; countdown: number; board: GameState;
};

/** Library owns geometry/rotation/collisions; this adapter owns the booth rules. */
export class StackGame {
  private lines = 0;
  private score = 0;
  private elapsed = 0;
  private countdown = COUNTDOWN_MS;
  private phase: StackPhase = "start";
  private reason: StackView["reason"] = null;
  private core = createEngine({ seed: 42, gravity: () => fallInterval(this.lines) });

  constructor() {
    this.core.on("lineClear", ({ lines }) => {
      this.lines += lines;
      this.score += pointsForRows(lines);
    });
    this.core.on("gameOver", () => this.finish("overflow"));
  }

  start(seed = Date.now(), presetBoard?: Playfield) {
    this.lines = 0; this.score = 0; this.elapsed = 0;
    this.countdown = COUNTDOWN_MS; this.reason = null; this.phase = "countdown";
    this.core.startGame({ mode: "marathon", seed, ...(presetBoard ? { presetBoard } : {}) });
  }

  tick(deltaMs: number) {
    if (this.phase === "countdown") {
      this.countdown -= deltaMs;
      if (this.countdown > 0) return;
      deltaMs = Math.max(0, -this.countdown);
      this.phase = "playing";
    }
    if (this.phase !== "playing") return;
    const advance = Math.min(Math.max(0, deltaMs), ROUND_MS - this.elapsed);
    // Small steps preserve individual line-clear events and avoid library catch-up caps.
    for (let left = advance; left > 0 && this.phase === "playing"; left -= 16) {
      this.core.tick(Math.min(16, left));
    }
    this.elapsed += advance;
    if (this.phase === "playing" && this.elapsed >= ROUND_MS) this.finish("time");
  }

  press(action: Action) {
    if (this.phase !== "playing") return;
    if (action === "left") this.core.moveLeft();
    if (action === "right") this.core.moveRight();
    if (action === "down") this.core.softDrop();
    if (action === "rotate") this.core.rotate("cw");
    if (action === "drop") this.core.hardDrop();
    this.core.tick(0);
  }

  release(action: Action) {
    if (action === "left") this.core.releaseMoveLeft();
    if (action === "right") this.core.releaseMoveRight();
    if (action === "down") this.core.releaseSoftDrop();
    this.core.tick(0);
  }

  releaseAll() { this.release("left"); this.release("right"); this.release("down"); }
  abort() { if (this.phase === "playing" || this.phase === "countdown") this.finish("aborted"); }
  private finish(reason: StackView["reason"]) { this.phase = "finished"; this.reason = reason; }
  destroy() { this.core.destroy(); }
  snapshot(): StackView {
    return {
      phase: this.phase, reason: this.reason, score: this.score, lines: this.lines,
      remainingMs: Math.max(0, ROUND_MS - this.elapsed),
      countdown: Math.max(1, Math.ceil(this.countdown / 1000)), board: this.core.getSnapshot(),
    };
  }
}