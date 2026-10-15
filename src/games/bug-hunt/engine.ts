export const COUNTDOWN_MS = 3_000;
export const ROUND_MS = 60_000;
export const GRID_SIZE = 4;
export const HIT_POINTS = 100;
export const MISTAKE_PENALTY = 50;
export const MAX_BUGS = 3;
export const LIFETIMES = [1400, 1300, 1100, 800] as const;
const SPAWN_INTERVALS = [600, 550, 470, 360] as const;
export const stageAt = (elapsed: number) => Math.min(3, Math.max(0, Math.floor(elapsed / 15_000)));
export type Target = { id: number; cell: number; kind: "bug" | "healthy"; expiresAt: number };
export type Feedback = { cell: number; kind: "hit" | "miss" | "mistake"; until: number };
export type BugView = {
  phase: "start" | "countdown" | "playing" | "finished";
  reason: "time" | "aborted" | null;
  countdown: number; remainingMs: number; stage: number; score: number;
  hits: number; misses: number; mistakes: number; streak: number; bestStreak: number;
  targets: Target[]; feedback: Feedback[];
};
export const initialView = (): BugView => ({
  phase: "start", reason: null, countdown: 3, remainingMs: ROUND_MS, stage: 0,
  score: 0, hits: 0, misses: 0, mistakes: 0, streak: 0, bestStreak: 0,
  targets: [], feedback: [],
});

/** Deterministic clock-driven reflex rules; no browser or server dependencies. */
export class BugGame {
  private state = initialView();
  private beginsAt = 0;
  private nextSpawn = 0;
  private id = 0;
  constructor(private random: () => number = Math.random) {}

  start(now: number) {
    this.state = { ...initialView(), phase: "countdown" };
    this.beginsAt = now + COUNTDOWN_MS;
    this.nextSpawn = this.beginsAt;
  }

  private expire(now: number) {
    this.state.feedback = this.state.feedback.filter((f) => f.until > now);
    this.state.targets = this.state.targets.filter((t) => {
      if (t.expiresAt > now) return true;
      if (t.kind === "bug") {
        this.state.misses += 1; this.state.streak = 0;
        if (t.expiresAt + 220 > now) this.state.feedback.push({ cell: t.cell, kind: "miss", until: t.expiresAt + 220 });
      }
      return false;
    });
  }

  private spawn(kind: Target["kind"], now: number, lifetime: number) {
    // Never introduce a target whose full lifetime extends past the round.
    if (now + lifetime > this.beginsAt + ROUND_MS) return;
    const occupied = new Set([...this.state.targets, ...this.state.feedback].map((t) => t.cell));
    const free = Array.from({ length: GRID_SIZE ** 2 }, (_, i) => i).filter((i) => !occupied.has(i));
    const cell = free[Math.min(free.length - 1, Math.floor(Math.max(0, this.random()) * free.length))];
    if (cell === undefined) return;
    this.state.targets.push({ id: ++this.id, cell, kind, expiresAt: now + lifetime });
  }

  tick(now: number) {
    const s = this.state;
    if (s.phase === "start" || s.phase === "finished") return;
    if (now < this.beginsAt) { s.countdown = Math.ceil((this.beginsAt - now) / 1000); return; }
    s.phase = "playing";
    const end = this.beginsAt + ROUND_MS;
    const time = Math.min(now, end);
    // Process scheduled spawns chronologically, even when a frame is delayed.
    while (this.nextSpawn <= time) {
      this.expire(this.nextSpawn);
      const stage = stageAt(this.nextSpawn - this.beginsAt);
      const lifetime = LIFETIMES[stage] ?? 800;
      if (s.targets.filter((t) => t.kind === "bug").length < MAX_BUGS) this.spawn("bug", this.nextSpawn, lifetime);
      const healthyCount = s.targets.filter((t) => t.kind === "healthy").length;
      for (let i = healthyCount; i < 4; i++) this.spawn("healthy", this.nextSpawn, lifetime);
      this.nextSpawn += SPAWN_INTERVALS[stage] ?? 360;
    }
    this.expire(time);
    s.stage = stageAt(time - this.beginsAt);
    s.remainingMs = Math.max(0, end - time);
    if (now >= end) { s.phase = "finished"; s.reason = "time"; s.targets = []; }
  }

  hit(cell: number, targetId: number, now: number) {
    this.tick(now);
    const s = this.state;
    if (s.phase !== "playing") return;
    const target = s.targets.find((t) => t.cell === cell && t.id === targetId);
    if (!target) return;
    s.targets = s.targets.filter((t) => t.id !== targetId);
    if (target.kind === "bug") {
      s.score += HIT_POINTS; s.hits += 1; s.streak += 1;
      s.bestStreak = Math.max(s.bestStreak, s.streak);
    } else {
      s.score = Math.max(0, s.score - MISTAKE_PENALTY); s.mistakes += 1; s.streak = 0;
    }
    s.feedback.push({ cell, kind: target.kind === "bug" ? "hit" : "mistake", until: now + 220 });
  }

  abort() {
    if (this.state.phase !== "playing" && this.state.phase !== "countdown") return;
    this.state.phase = "finished"; this.state.reason = "aborted"; this.state.targets = [];
  }
  snapshot(): BugView { return { ...this.state, targets: [...this.state.targets], feedback: [...this.state.feedback] }; }
}