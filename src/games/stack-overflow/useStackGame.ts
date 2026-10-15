import { useCallback, useEffect, useRef, useState } from "react";
import { StackGame, type Action } from "./engine";

const KEYS: Record<string, Action> = {
  ArrowLeft: "left", ArrowRight: "right", ArrowDown: "down", ArrowUp: "rotate", Space: "drop",
};

export function useStackGame() {
  const game = useRef<StackGame | null>(null);
  const [view, setView] = useState(() => {
    const initial = new StackGame();
    const result = initial.snapshot(); initial.destroy(); return result;
  });
  const update = useCallback(() => { if (game.current) setView(game.current.snapshot()); }, []);
  const press = useCallback((action: Action) => { game.current?.press(action); update(); }, [update]);
  const release = useCallback((action: Action) => { game.current?.release(action); update(); }, [update]);
  const start = useCallback(() => { game.current?.start(); update(); }, [update]);

  useEffect(() => {
    const current = new StackGame(); game.current = current;
    let previous = performance.now();
    const timer = window.setInterval(() => {
      const now = performance.now();
      const phase = current.snapshot().phase;
      if (phase === "playing" || phase === "countdown") { current.tick(now - previous); update(); }
      previous = now;
    }, 32);
    const down = (event: KeyboardEvent) => {
      const action = KEYS[event.code];
      if (!action || current.snapshot().phase !== "playing") return;
      event.preventDefault();
      if (!event.repeat) press(action);
    };
    const up = (event: KeyboardEvent) => {
      const action = KEYS[event.code];
      if (!action || current.snapshot().phase !== "playing") return;
      event.preventDefault(); release(action);
    };
    const visibility = () => { if (document.hidden) { current.abort(); update(); } };
    const blur = () => current.releaseAll();
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    window.addEventListener("blur", blur);
    document.addEventListener("visibilitychange", visibility);
    return () => {
      window.clearInterval(timer); current.abort(); current.destroy(); game.current = null;
      window.removeEventListener("keydown", down); window.removeEventListener("keyup", up);
      window.removeEventListener("blur", blur); document.removeEventListener("visibilitychange", visibility);
    };
  }, [press, release, update]);
  return { view, start, press, release };
}