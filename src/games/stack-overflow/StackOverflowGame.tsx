import { useEffect, useState } from "react";
import { ArrowDown, ArrowDownToLine, ArrowLeft, ArrowRight, Layers, Play, RotateCw, Timer, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArcadeShell, Recruit } from "@/components/kni/ArcadeShell";
import { LocalRankingTag } from "@/components/kni/LocalRankingTag";
import { SCORES_CHANGED_EVENT } from "@/lib/admin-auth";
import { STORAGE_KEYS } from "@/lib/local-scores";
import { StackBoard, NextPiece } from "./Board";
import { useStackGame } from "./useStackGame";
import { loadStackScores, saveStackScore, type StackEntry } from "./leaderboard";
import type { Action } from "./engine";

const CONTROLS = [
  { action: "left", label: "Przesuń w lewo", Icon: ArrowLeft },
  { action: "rotate", label: "Obróć blok", Icon: RotateCw },
  { action: "right", label: "Przesuń w prawo", Icon: ArrowRight },
  { action: "down", label: "Przyspiesz opadanie", Icon: ArrowDown },
  { action: "drop", label: "Zrzuć blok", Icon: ArrowDownToLine },
] satisfies { action: Action; label: string; Icon: typeof ArrowLeft }[];

export function StackOverflowGame() {
  const { view, start, press, release } = useStackGame();
  const [scores, setScores] = useState<StackEntry[]>([]);
  const [nick, setNick] = useState("");
  const [saved, setSaved] = useState<number | null>(null);
  const [error, setError] = useState("");
  useEffect(() => {
    const reload = () => setScores(loadStackScores()); reload();
    window.addEventListener("storage", reload); window.addEventListener(SCORES_CHANGED_EVENT, reload);
    return () => { window.removeEventListener("storage", reload); window.removeEventListener(SCORES_CHANGED_EVENT, reload); };
  }, []);
  const begin = () => { setSaved(null); setError(""); setNick(""); start(); };
  const running = view.phase === "playing" || view.phase === "countdown";
  const previewMode = view.phase === "start";
  return (
    <ArcadeShell label="STACK_OVERFLOW" footerLabel="STACK OVERFLOW_ / ARCADE">
      <header>
        <h1 className={`font-display font-bold leading-none ${previewMode ? "game-title" : "text-3xl"}`}>Stack<span className="text-primary">_</span>Overflow</h1>
        <p className="mt-3 text-xl text-accent">Zwolnij pamięć. Uniknij awarii.</p>
      </header>
      <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <section aria-label="Stack_Overflow" className="min-w-0">
          <div className="mb-4 flex flex-wrap gap-x-8 gap-y-3 border-y py-4 font-mono">
            <Stat label="Punkty" value={view.score.toLocaleString("pl-PL")} Icon={Trophy} />
            <Stat label="Czas" value={`${Math.floor(Math.ceil(view.remainingMs / 1000) / 60)}:${String(Math.ceil(view.remainingMs / 1000) % 60).padStart(2, "0")}`} Icon={Timer} />
            <Stat label="Wiersze" value={String(view.lines)} Icon={Layers} />
          </div>
          <div className="stack-play-area">
            <div className="relative min-w-0">
              <StackBoard state={view.board} active={view.phase === "playing"} />
              {view.phase !== "playing" && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-background/85 px-3 text-center">
                  {view.phase === "countdown" ? <p role="status" className="font-mono text-6xl font-bold text-primary">{view.countdown}</p> : previewMode ? <>
                    <Layers className="h-12 w-12 text-primary" aria-hidden />
                    <p className="font-mono text-sm uppercase text-accent">Pamięć gotowa</p>
                    <Button variant="arcade" onClick={begin}><Play /> Zagraj</Button>
                  </> : <>
                    <p className="font-mono text-lg font-bold text-accent">{view.reason === "time" ? "Czas minął" : view.reason === "aborted" ? "Runda przerwana" : "Stack overflow!"}</p>
                    <p className="font-mono text-3xl font-bold">{view.score} <span className="text-sm text-muted-foreground">pkt</span></p>
                    <Button variant="arcade" onClick={begin}><RotateCw /> Zagraj ponownie</Button>
                  </>}
                </div>
              )}
            </div>
            <aside className="flex min-w-0 flex-col gap-6">
              <div>
                <h2 className="mb-3 font-mono text-xs uppercase text-muted-foreground">Następny blok</h2>
                <NextPiece kind={view.board.queue[0]} />
              </div>
              <div>
                <h2 className="font-mono text-xs uppercase text-muted-foreground">Poziom</h2>
                <p className="mt-1 font-mono text-3xl font-bold text-accent">{1 + Math.floor(view.lines / 5)}</p>
              </div>
              <div className="space-y-2 border-t pt-4 font-mono text-xs text-muted-foreground">
                <p>1 wiersz <span className="text-foreground">100</span></p>
                <p>2 wiersze <span className="text-foreground">300</span></p>
                <p>3 wiersze <span className="text-foreground">500</span></p>
                <p>4 wiersze <span className="text-foreground">800</span></p>
              </div>
            </aside>
          </div>
          <div className="stack-controls mt-4 max-w-80" aria-label="Sterowanie">
            {CONTROLS.map(({ action, label, Icon }) => <Button key={action} variant="outline" aria-label={label} title={label} disabled={view.phase !== "playing"}
              onPointerDown={(event) => { event.preventDefault(); event.currentTarget.setPointerCapture(event.pointerId); press(action); }}
              onPointerUp={() => release(action)} onPointerCancel={() => release(action)} onLostPointerCapture={() => release(action)}
              onClick={(event) => { if (event.detail === 0) { press(action); release(action); } }}><Icon aria-hidden /></Button>)}
          </div>
          {!running && view.phase === "finished" && view.reason !== "aborted" && (
            <form className="mt-5 max-w-md space-y-3 border-t pt-5" onSubmit={(event) => {
              event.preventDefault();
              if (saved !== null) return;
              const clean = nick.trim().replace(/\s+/g, " ");
              if (clean.length < 2 || clean.length > 16) { setError("Nick musi mieć od 2 do 16 znaków."); return; }
              try {
                setSaved(saveStackScore({ nick: clean, score: view.score, lines: view.lines }));
                setScores(loadStackScores()); setError("");
                window.dispatchEvent(new Event(SCORES_CHANGED_EVENT));
              } catch { setError("Nie udało się zapisać wyniku. Sprawdź pamięć przeglądarki i spróbuj ponownie."); }
            }}>
              {saved !== null ? <p role="status" className="text-accent">Wynik zapisany — miejsce {saved}.</p> : <>
                <Label htmlFor="stack-nick">Twój nick</Label>
                <div className="flex flex-wrap gap-2"><Input id="stack-nick" className="min-w-0 flex-1" minLength={2} maxLength={16} required value={nick} onChange={(e) => setNick(e.target.value)} autoComplete="off" /><Button type="submit" variant="arcade">Zapisz wynik</Button></div>
              </>}
              {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
            </form>
          )}
        </section>
        <section aria-label="Ranking Stack_Overflow" className="min-w-0 lg:pt-4">
          <h2 className="mb-4 flex items-center gap-2 font-display text-2xl font-bold"><Trophy className="text-primary" /> Ranking</h2>
          <LocalRankingTag storageKey={STORAGE_KEYS.stackOverflow} game="stack-overflow" />
          {scores.length === 0 ? <p className="py-6 text-sm text-muted-foreground">Ranking pusty — zagraj jako pierwszy!</p> : <ol className="divide-y">
            {scores.map((row, i) => <li key={row.id} className="flex items-center gap-3 py-3 font-mono text-sm"><span className="w-6 text-muted-foreground">{i + 1}.</span><span className="min-w-0 flex-1 truncate font-sans">{row.nick}</span><span className="text-accent">{row.score} pkt</span></li>)}
          </ol>}
        </section>
      </div>
      <Recruit />
    </ArcadeShell>
  );
}

function Stat({ label, value, Icon }: { label: string; value: string; Icon: typeof Timer }) {
  return <div><p className="mb-1 flex items-center gap-1.5 text-xs uppercase text-muted-foreground"><Icon className="h-3.5 w-3.5" />{label}</p><p aria-label={label} className="text-2xl font-bold tabular-nums text-primary">{value}</p></div>;
}