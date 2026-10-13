import { Check, X } from "lucide-react";
import { CELL_COUNT, GRID_SIZE } from "./engine";
import type { GameState } from "./useMemoryGame";

export function Board({ state, onPick }: { state: GameState; onPick: (i: number) => void }) {
  const { phase, pattern, picked, wrong, feedback } = state;
  const showPattern = phase === "memorizing" || (phase === "feedback" && feedback === "fail");
  const interactive = phase === "recalling";
  const boardAnim =
    phase === "feedback" && feedback === "fail" ? "animate-shake" : feedback === "success" ? "animate-pop" : "";

  return (
    <div
      role="grid"
      aria-label="Plansza pamięci 5 na 5"
      className={`grid w-full gap-2 sm:gap-3 ${boardAnim}`}
      style={{ gridTemplateColumns: `repeat(${GRID_SIZE}, minmax(0, 1fr))` }}
    >
      {Array.from({ length: CELL_COUNT }, (_, i) => {
        const row = Math.floor(i / GRID_SIZE) + 1;
        const col = (i % GRID_SIZE) + 1;
        const isPicked = picked.has(i);
        const isWrong = wrong === i;
        let cls = "";
        let icon: React.ReactNode = null;
        let status = "";
        if (isWrong) {
          cls = "mem-cell-wrong";
          icon = <X className="h-1/2 w-1/2" aria-hidden />;
          status = ", błędne pole";
        } else if (isPicked) {
          cls = "mem-cell-ok";
          icon = <Check className="h-1/2 w-1/2" aria-hidden />;
          status = ", wybrane";
        } else if (showPattern && pattern.has(i)) {
          cls = phase === "memorizing" ? "mem-cell-lit" : "mem-cell-missed";
          status = phase === "memorizing" ? ", podświetlone" : ", poprawne pole";
          if (phase !== "memorizing") icon = <span className="font-mono text-xs" aria-hidden>●</span>;
        }
        return (
          <button
            key={i}
            type="button"
            aria-label={`Rząd ${row}, kolumna ${col}${status}`}
            aria-disabled={!interactive}
            onClick={() => onPick(i)}
            className={`mem-cell flex items-center justify-center ${interactive ? "cursor-pointer" : "cursor-default"} ${cls}`}
          >
            {icon}
          </button>
        );
      })}
    </div>
  );
}
