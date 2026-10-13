import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { exportScores } from "@/lib/local-scores";

/** Oznaczenie trybu Stoisko / offline + eksport kopii zapasowej. */
export function LocalRankingTag({ storageKey, game }: { storageKey: string; game: string }) {
  return (
    <div className="mb-3 flex flex-wrap items-center justify-between gap-2 border-b pb-3">
      <span className="rounded border border-accent/50 px-2 py-0.5 font-mono text-[11px] uppercase tracking-widest text-accent">
        Ranking tego laptopa
      </span>
      <Button variant="ghost" size="sm" onClick={() => exportScores(storageKey, game)}>
        <Download /> Eksport JSON
      </Button>
    </div>
  );
}
