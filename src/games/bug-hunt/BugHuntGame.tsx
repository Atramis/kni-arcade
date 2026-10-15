import { useEffect, useState } from "react";
import { Bug, Check, CodeXml, Crosshair, Play, RotateCw, ShieldCheck, Trophy, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArcadeShell, Recruit } from "@/components/kni/ArcadeShell";
import { LocalRankingTag } from "@/components/kni/LocalRankingTag";
import { SCORES_CHANGED_EVENT } from "@/lib/admin-auth";
import { STORAGE_KEYS } from "@/lib/local-scores";
import { useBugGame } from "./useBugGame";
import { loadBugScores, saveBugScore, type BugEntry } from "./leaderboard";

export function BugHuntGame() {
  const { view, start, hit } = useBugGame();
  const [scores, setScores] = useState<BugEntry[]>([]);
  const [nick, setNick] = useState("");
  const [saved, setSaved] = useState<number | null>(null);
  const [error, setError] = useState("");
  useEffect(() => {
    const reload = () => setScores(loadBugScores()); reload();
    window.addEventListener("storage", reload); window.addEventListener(SCORES_CHANGED_EVENT, reload);
    return () => { window.removeEventListener("storage", reload); window.removeEventListener(SCORES_CHANGED_EVENT, reload); };
  }, []);
  const begin = () => { setSaved(null); setNick(""); setError(""); start(); };
  const finished = view.phase === "finished";
  const playing = view.phase === "playing";
  return (
    <ArcadeShell label="BUG_HUNT" footerLabel="BUG HUNT_ / ARCADE">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-4xl font-bold leading-none sm:text-5xl">Bug<span className="text-primary">_</span>Hunt</h1>
          <p className="mt-3 text-lg text-accent">Namierz błąd. Ocal system.</p>
        </div>
        <span className="flex items-center gap-2 font-mono text-xs uppercase text-muted-foreground"><Crosshair className="h-4 w-4 text-primary" /> Skanowanie pamięci</span>
      </header>
      <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <section aria-label="Gra Bug_Hunt" className="min-w-0">
          <div className="mb-5 grid grid-cols-3 gap-3 border-y py-4 font-mono">
            <Counter label="Punkty" value={String(view.score)} />
            <Counter label="Czas" value={`0:${String(Math.ceil(view.remainingMs / 1000)).padStart(2, "0")}`.replace("0:60", "1:00")} />
            <Counter label="Seria" value={String(view.streak)} />
          </div>
          <div className="relative mx-auto max-w-lg">
            <div className="bug-grid" role="group" aria-label="Pola skanowania">
              {Array.from({ length: 16 }, (_, cell) => {
                const target = view.targets.find((t) => t.cell === cell);
                const feedback = view.feedback.find((f) => f.cell === cell);
                const bug = target?.kind === "bug";
                return <Button key={cell} variant="outline" type="button"
                  className={`bug-cell ${target ? bug ? "bug-corrupt" : "bug-healthy" : "bug-empty"} ${feedback ? `bug-${feedback.kind}` : ""}`}
                  disabled={!playing} aria-disabled={!target || !playing}
                  aria-label={`${target ? bug ? "Błąd" : "Zdrowy symbol" : "Puste pole"} ${cell + 1}`}
                  data-target-kind={target?.kind ?? "empty"} data-target-id={target?.id}
                  onClick={() => { if (target) hit(cell, target.id); }}>
                  {target ? bug ? <CorruptSymbol /> : <CodeXml className="bug-symbol" aria-hidden /> : feedback ? <>
                    {feedback.kind === "hit" ? <Check className="bug-symbol" /> : <X className="bug-symbol" />}
                    <span className="bug-cell-caption">{feedback.kind === "hit" ? "+100" : feedback.kind === "mistake" ? "−50" : "Ratunek spóźniony"}</span>
                  </> : <span className="font-mono text-xs text-muted-foreground/50">{cell.toString(16).toUpperCase().padStart(2, "0")}</span>}
                </Button>;
              })}
            </div>
            {!playing && <div className="absolute inset-0 flex flex-col items-center justify-center gap-5 rounded-lg bg-background/95 p-5 text-center">
              {view.phase === "countdown" ? <p role="status" className="font-mono text-6xl font-bold text-primary">{view.countdown}</p> : view.phase === "start" ? <>
                <Bug className="h-12 w-12 text-accent" aria-hidden />
                <h2 className="font-display text-2xl font-bold">Polowanie na błędy</h2>
                <div className="flex w-full max-w-xs justify-around gap-4">
                  <div className="flex flex-col items-center gap-2 text-accent"><CorruptSymbol /><span className="font-mono text-xs">BŁĄD · +100</span></div>
                  <div className="flex flex-col items-center gap-2 text-muted-foreground"><CodeXml className="h-10 w-10" /><span className="font-mono text-xs">ZDROWY · −50</span></div>
                </div>
                <Button variant="arcade" size="lg" onClick={begin}><Play /> Zagraj</Button>
              </> : <>
                <ShieldCheck className="h-10 w-10 text-primary" aria-hidden />
                <h2 role="status" className="font-display text-xl font-bold">{view.reason === "aborted" ? "Runda przerwana" : "Skanowanie zakończone"}</h2>
                <p className="font-mono text-4xl font-bold text-accent">{view.score} <span className="text-sm">pkt</span></p>
                <Button variant="arcade" onClick={begin}><RotateCw /> Zagraj ponownie</Button>
              </>}
            </div>}
          </div>
          <div className="mx-auto mt-4 flex max-w-lg flex-wrap justify-between gap-2 font-mono text-xs text-muted-foreground">
            <span>Etap {view.stage + 1}/4</span><span className="text-accent">Trafienia: {view.hits}</span><span>Pominięte: {view.misses}</span><span>Pomyłki: {view.mistakes}</span>
          </div>
          {finished && view.reason === "time" && <form className="mx-auto mt-5 max-w-lg space-y-3 border-t pt-5" onSubmit={(e) => {
            e.preventDefault(); if (saved !== null) return;
            const clean = nick.trim().replace(/\s+/g, " ");
            if (clean.length < 2 || clean.length > 16) { setError("Nick musi mieć od 2 do 16 znaków."); return; }
            try {
              const rank = saveBugScore({ nick: clean, score: view.score, hits: view.hits, misses: view.misses, mistakes: view.mistakes, bestStreak: view.bestStreak });
              setSaved(rank); setScores(loadBugScores()); setError("");
              window.dispatchEvent(new Event(SCORES_CHANGED_EVENT));
            } catch { setError("Nie udało się zapisać wyniku. Sprawdź pamięć przeglądarki i spróbuj ponownie."); }
          }}>
            <p className="font-mono text-sm text-muted-foreground">Najlepsza seria: <span className="text-accent">{view.bestStreak}</span></p>
            {saved !== null ? <p role="status" className="text-accent">Wynik zapisany — miejsce {saved}.</p> : <>
              <Label htmlFor="bug-nick">Twój nick</Label>
              <div className="flex flex-wrap gap-2"><Input id="bug-nick" minLength={2} maxLength={16} required autoComplete="off" className="min-w-0 flex-1" value={nick} onChange={(e) => setNick(e.target.value)} /><Button type="submit" variant="arcade">Zapisz wynik</Button></div>
            </>}
            {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
          </form>}
        </section>
        <section aria-label="Ranking Bug_Hunt" className="min-w-0 lg:pt-4">
          <h2 className="mb-4 flex items-center gap-2 font-display text-2xl font-bold"><Trophy className="text-primary" /> Ranking</h2>
          <LocalRankingTag storageKey={STORAGE_KEYS.bugHunt} game="bug-hunt" />
          {scores.length === 0 ? <p className="py-6 text-sm text-muted-foreground">Ranking pusty — zagraj jako pierwszy!</p> : <ol className="divide-y">
            {scores.map((r, i) => <li key={r.id} className="flex items-center gap-3 py-3 font-mono text-sm"><span className="w-6 text-muted-foreground">{i + 1}.</span><span className="min-w-0 flex-1 truncate font-sans">{r.nick}</span><span className="shrink-0 text-accent">{r.score} pkt</span></li>)}
          </ol>}
        </section>
      </div>
      <Recruit />
    </ArcadeShell>
  );
}

function CorruptSymbol() {
  return <span className="bug-corrupt-symbol" aria-hidden><Bug className="bug-symbol" /><span className="bug-break">!</span></span>;
}
function Counter({ label, value }: { label: string; value: string }) {
  return <div><p className="mb-1 text-xs uppercase text-muted-foreground">{label}</p><p aria-label={label} className="font-mono text-2xl font-bold tabular-nums text-primary">{value}</p></div>;
}