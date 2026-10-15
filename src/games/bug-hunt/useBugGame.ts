import { useCallback, useEffect, useRef, useState } from "react";
import { BugGame, initialView } from "./engine";

export function useBugGame() {
  const game = useRef<BugGame | null>(null);
  const [view, setView] = useState(initialView);
  const sync = useCallback(() => { if (game.current) setView(game.current.snapshot()); }, []);
  const start = useCallback(() => { game.current?.start(performance.now()); sync(); }, [sync]);
  const hit = useCallback((cell: number, id: number) => { game.current?.hit(cell, id, performance.now()); sync(); }, [sync]);
  useEffect(() => {
    const current = new BugGame(); game.current = current;
    const timer = window.setInterval(() => {
      const phase = current.snapshot().phase;
      if (phase !== "playing" && phase !== "countdown") return;
      current.tick(performance.now()); sync();
    }, 32);
    const visibility = () => { if (document.hidden) { current.abort(); sync(); } };
    document.addEventListener("visibilitychange", visibility);
    return () => { window.clearInterval(timer); document.removeEventListener("visibilitychange", visibility); current.abort(); game.current = null; };
  }, [sync]);
  return { view, start, hit };
}