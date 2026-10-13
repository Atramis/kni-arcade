import { useCallback, useEffect, useRef, useState } from "react";
import {
  FAIL_MS,
  GAME_DURATION_MS,
  MAX_LEVEL,
  MEMORIZE_MS,
  START_LIVES,
  SUCCESS_MS,
  TIME_BONUS_MS,
  cellsForLevel,
  randomPattern,
} from "./engine";

export type Phase = "start" | "countdown" | "memorizing" | "recalling" | "feedback" | "finished";
export type EndReason = "lives" | "time" | "win" | "aborted";

export interface GameState {
  phase: Phase;
  runId: string;
  countdown: number;
  level: number;
  lives: number;
  errors: number;
  pattern: Set<number>;
  picked: Set<number>;
  wrong: number | null;
  feedback: "success" | "fail" | null;
  bestLevel: number;
  bestTimeMs: number | null;
  startedAt: number | null;
  /** Extra time earned by solving puzzles. */
  bonusMs: number;
  phaseStartedAt: number;
  endReason: EndReason | null;
}

const fresh = (): GameState => ({
  phase: "start",
  runId: "",
  countdown: 3,
  level: 1,
  lives: START_LIVES,
  errors: 0,
  pattern: new Set(),
  picked: new Set(),
  wrong: null,
  feedback: null,
  bestLevel: 0,
  bestTimeMs: null,
  startedAt: null,
  bonusMs: 0,
  phaseStartedAt: 0,
  endReason: null,
});

const ACTIVE: Phase[] = ["countdown", "memorizing", "recalling", "feedback"];

export function useMemoryGame() {
  const g = useRef<GameState>(fresh());
  const [, setV] = useState(0);
  const [now, setNow] = useState(0);
  const timers = useRef<number[]>([]);
  const render = () => setV((v) => v + 1);

  const clearTimers = () => {
    timers.current.forEach((t) => window.clearTimeout(t));
    timers.current = [];
  };
  const later = (fn: () => void, ms: number) => {
    timers.current.push(window.setTimeout(fn, ms));
  };

  const finish = useCallback((reason: EndReason) => {
    const s = g.current;
    if (s.phase === "finished") return;
    clearTimers();
    s.phase = "finished";
    s.endReason = reason;
    render();
  }, []);

  /** Returns true if time ran out (and ends the game). */
  const timeUp = useCallback(() => {
    const s = g.current;
    if (s.startedAt == null) return false;
    if (performance.now() - s.startedAt >= GAME_DURATION_MS + s.bonusMs) {
      finish("time");
      return true;
    }
    return false;
  }, [finish]);

  const beginRound = useCallback(() => {
    const s = g.current;
    if (s.phase === "finished") return;
    const t = performance.now();
    if (s.startedAt == null) s.startedAt = t;
    if (timeUp()) return;
    s.pattern = randomPattern(cellsForLevel(s.level));
    s.picked = new Set();
    s.wrong = null;
    s.feedback = null;
    s.phase = "memorizing";
    s.phaseStartedAt = t;
    render();
    later(() => {
      if (g.current.phase !== "memorizing" || timeUp()) return;
      g.current.phase = "recalling";
      g.current.phaseStartedAt = performance.now();
      render();
    }, MEMORIZE_MS);
  }, [timeUp]);

  const start = useCallback(() => {
    clearTimers();
    g.current = { ...fresh(), phase: "countdown", runId: crypto.randomUUID() };
    render();
    later(() => { g.current.countdown = 2; render(); }, 1000);
    later(() => { g.current.countdown = 1; render(); }, 2000);
    later(() => beginRound(), 3000);
  }, [beginRound]);

  const reset = useCallback(() => {
    clearTimers();
    g.current = fresh();
    render();
  }, []);

  const pick = useCallback(
    (i: number) => {
      const s = g.current;
      if (s.phase !== "recalling") return;
      if (timeUp()) return;
      if (s.picked.has(i)) return;
      const t = performance.now();
      if (s.pattern.has(i)) {
        s.picked = new Set(s.picked).add(i);
        if (s.picked.size === s.pattern.size) {
          // Award bonus time, but never let the remaining clock exceed the full 60 s.
          const elapsed = t - (s.startedAt ?? t);
          s.bonusMs = Math.min(s.bonusMs + TIME_BONUS_MS, Math.max(0, elapsed));
          s.bestLevel = s.level;
          s.bestTimeMs = Math.max(1, Math.round(t - (s.startedAt ?? t)));
          if (s.level >= MAX_LEVEL) {
            s.feedback = "success";
            finish("win");
            return;
          }
          s.phase = "feedback";
          s.feedback = "success";
          render();
          later(() => {
            if (g.current.phase !== "feedback") return;
            g.current.level += 1;
            beginRound();
          }, SUCCESS_MS);
          return;
        }
        render();
      } else {
        s.wrong = i;
        s.lives -= 1;
        s.errors += 1;
        s.phase = "feedback";
        s.feedback = "fail";
        render();
        later(() => {
          if (g.current.phase !== "feedback") return;
          if (g.current.lives <= 0) finish("lives");
          else beginRound();
        }, FAIL_MS);
      }
    },
    [beginRound, finish, timeUp],
  );

  // Global clock
  useEffect(() => {
    const id = window.setInterval(() => {
      const s = g.current;
      if (ACTIVE.includes(s.phase)) {
        setNow(performance.now());
        if (s.phase !== "countdown") timeUp();
      }
    }, 100);
    return () => window.clearInterval(id);
  }, [timeUp]);

  // Leaving the tab aborts the attempt
  useEffect(() => {
    const onVis = () => {
      if (document.hidden && ACTIVE.includes(g.current.phase)) finish("aborted");
    };
    document.addEventListener("visibilitychange", onVis);
    return () => {
      document.removeEventListener("visibilitychange", onVis);
      clearTimers();
    };
  }, [finish]);

  const s = g.current;
  const t = now || performance.now();
  const remainingMs =
    s.startedAt == null
      ? GAME_DURATION_MS
      : Math.max(0, GAME_DURATION_MS + s.bonusMs - (t - s.startedAt));
  const memorizeProgress =
    s.phase === "memorizing" ? Math.min(1, (t - s.phaseStartedAt) / MEMORIZE_MS) : 0;

  return { state: s, remainingMs, memorizeProgress, start, reset, pick };
}
