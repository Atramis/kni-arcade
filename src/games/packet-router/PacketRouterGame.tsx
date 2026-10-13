import { useCallback, useEffect, useRef, useState } from "react";
import { Trophy, Send, RotateCcw, Save } from "lucide-react";
import {
  E, N, S, W, SIZE, ROUND_SECONDS, TIME_BONUS, FAIL_PENALTY,
  findRoute, generatePuzzle, rotate, scoreFail, scoreSuccess, validateNick, type Puzzle,
} from "./engine";
import { loadScores, saveScore, type Entry } from "./leaderboard";
import { LocalRankingTag } from "@/components/kni/LocalRankingTag";
import { STORAGE_KEYS } from "@/lib/local-scores";
import { Button } from "@/components/ui/button";
import { ArcadeShell, Recruit } from "@/components/kni/ArcadeShell";

type Screen = "start" | "play" | "end";
type Status = "idle" | "ok" | "fail" | "sending";
type Result = { score: number; delivered: number; bestStreak: number };

export function PacketRouterGame() {
  const [screen, setScreen] = useState<Screen>("start");
  const [scores, setScores] = useState<Entry[]>([]);
  const [result, setResult] = useState<Result>({ score: 0, delivered: 0, bestStreak: 0 });
  const [run, setRun] = useState(0);
  useEffect(() => setScores(loadScores()), []);
  const play = () => { setRun((r) => r + 1); setScreen("play"); };

  return (
    <ArcadeShell label="PACKET_ROUTER" footerLabel="PACKET ROUTER_ / ARCADE">
      {screen === "start" && <StartScreen scores={scores} onPlay={play} />}
      {screen === "play" && <PlayScreen key={run} onEnd={(r) => { setResult(r); setScreen("end"); }} />}
      {screen === "end" && <EndScreen key={run} result={result} scores={scores} onSaved={setScores} onAgain={play} />}
    </ArcadeShell>
  );
}

function StartScreen({ scores, onPlay }: { scores: Entry[]; onPlay: () => void }) {
  return (
    <div className="grid flex-1 items-start gap-8 lg:grid-cols-[1fr_22rem]">
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="game-title font-display font-bold leading-none">Packet<span className="text-primary">_</span><wbr />Router</h1>
          <p className="mt-3 text-xl text-accent sm:text-2xl">Sieciowy kurier</p>
        </div>
        <p className="max-w-xl text-lg text-muted-foreground">
          Obróć kafelki i dostarcz pakiet do celu!<br />
          Masz <b className="font-mono text-foreground">2 minuty</b>. Każda rozwiązana zagadka to <b className="font-mono text-foreground">+10 sekund</b>.
        </p>
        <div><Button autoFocus variant="arcade" size="hero" onClick={onPlay}>Zagraj</Button></div>
        <Recruit />
      </div>
      <Leaderboard scores={scores} />
    </div>
  );
}

function Leaderboard({ scores, highlight }: { scores: Entry[]; highlight?: number | undefined }) {
  return (
    <section aria-labelledby="lb-pr" className="rounded-lg border bg-card/80 p-4">
      <LocalRankingTag storageKey={STORAGE_KEYS.packetRouter} game="packet-router" />
      <div className="mb-3 flex items-center justify-between gap-2">
        <h2 id="lb-pr" className="flex items-center gap-2 font-mono text-sm font-semibold uppercase tracking-widest text-primary"><Trophy className="h-4 w-4" aria-hidden /> Top 10</h2>
              </div>
      {scores.length === 0 ? (
        <p className="text-sm text-muted-foreground">Brak wyników. Bądź pierwszy!</p>
      ) : (
        <ol className="space-y-1">
          {scores.map((s, i) => (
            <li key={s.at + s.nick} className={`grid grid-cols-[2rem_minmax(0,1fr)_auto] items-center rounded px-2 py-1.5 font-mono text-sm ${s.at === highlight ? "bg-accent/15 text-accent" : ""}`}>
              <span>{i + 1}.</span>
              <span className="truncate font-sans">{s.at === highlight ? "▶ " : ""}{s.nick}</span>
              <span className="font-bold tabular-nums">{s.score} pkt</span>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}

function TileSvg({ mask, lit }: { mask: number; lit: boolean }) {
  const cls = lit ? "stroke-success" : "stroke-tile-line";
  return (
    <svg viewBox="0 0 100 100" className="h-full w-full">
      {mask & N ? <line x1="50" y1="50" x2="50" y2="0" className={cls} strokeWidth="18" strokeLinecap="round" /> : null}
      {mask & E ? <line x1="50" y1="50" x2="100" y2="50" className={cls} strokeWidth="18" strokeLinecap="round" /> : null}
      {mask & S ? <line x1="50" y1="50" x2="50" y2="100" className={cls} strokeWidth="18" strokeLinecap="round" /> : null}
      {mask & W ? <line x1="50" y1="50" x2="0" y2="50" className={cls} strokeWidth="18" strokeLinecap="round" /> : null}
      <circle cx="50" cy="50" r="10" className={lit ? "fill-success" : "fill-tile-line"} />
    </svg>
  );
}

function PlayScreen({ onEnd }: { onEnd: (r: Result) => void }) {
  const [puzzle, setPuzzle] = useState<Puzzle>(() => generatePuzzle(0));
  const [timeLeft, setTimeLeft] = useState(ROUND_SECONDS);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [delivered, setDelivered] = useState(0);
  const [status, setStatus] = useState<Status>("idle");
  const [msg, setMsg] = useState("Dotknij kafelka, aby go obrócić");
  const [sel, setSel] = useState(0);
  const [packetAt, setPacketAt] = useState<number | null>(null);
  const [route, setRoute] = useState<number[]>([]);
  const stats = useRef<Result>({ score: 0, delivered: 0, bestStreak: 0 });
  stats.current = { score, delivered, bestStreak };
  const timers = useRef<number[]>([]);
  const endRef = useRef(Date.now() + ROUND_SECONDS * 1000);
  const onEndRef = useRef(onEnd);
  onEndRef.current = onEnd;

  // Clock + cleanup of every pending timer when leaving the game.
  useEffect(() => {
    const id = window.setInterval(() => {
      const left = Math.max(0, Math.ceil((endRef.current - Date.now()) / 1000));
      setTimeLeft(left);
      if (left === 0) { window.clearInterval(id); onEndRef.current(stats.current); }
    }, 200);
    return () => {
      window.clearInterval(id);
      timers.current.forEach((t) => window.clearTimeout(t));
      timers.current = [];
    };
  }, []);

  const busy = status === "sending";
  const turn = (i: number) => {
    if (busy) return;
    setSel(i);
    setPuzzle((p) => ({ ...p, tiles: p.tiles.map((t, k) => (k === i ? rotate(t) : t)) }));
    if (status !== "idle") { setStatus("idle"); setMsg("Dotknij kafelka, aby go obrócić"); }
  };

  const send = useCallback(() => {
    if (busy) return;
    const r = findRoute(puzzle);
    if (!r) {
      const s = scoreFail(score);
      setScore(s.score); setStreak(0); setStatus("fail");
      setMsg(`Brak połączenia! −${FAIL_PENALTY} pkt, seria wyzerowana`);
      return;
    }
    setStatus("sending"); setRoute(r); setMsg("Pakiet w drodze…");
    r.forEach((cell, k) => timers.current.push(window.setTimeout(() => setPacketAt(cell), k * 80)));
    timers.current.push(window.setTimeout(() => {
      endRef.current += TIME_BONUS * 1000;
      const s = scoreSuccess(score, streak);
      setScore(s.score); setStreak(s.streak); setBestStreak((b) => Math.max(b, s.streak));
      setDelivered((d) => d + 1);
      setStatus("ok"); setMsg(`Dostarczono! +${s.score - score} pkt, +${TIME_BONUS} s`);
      setPacketAt(null); setRoute([]);
      setPuzzle(generatePuzzle(delivered + 1));
    }, r.length * 80 + 250));
  }, [busy, puzzle, score, streak, delivered]);

  const skip = () => {
    if (busy) return;
    setStreak(0); setStatus("idle"); setMsg("Nowa zagadka — seria wyzerowana");
    setPuzzle(generatePuzzle(delivered));
  };

  // Keyboard controls; listener removed on every re-render and on leaving the game.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const r = Math.floor(sel / SIZE), c = sel % SIZE;
      if (e.key === "Enter") { e.preventDefault(); send(); }
      else if (e.key === " ") { e.preventDefault(); turn(sel); }
      else if (e.key === "ArrowUp") { e.preventDefault(); setSel(Math.max(0, r - 1) * SIZE + c); }
      else if (e.key === "ArrowDown") { e.preventDefault(); setSel(Math.min(SIZE - 1, r + 1) * SIZE + c); }
      else if (e.key === "ArrowLeft") setSel(r * SIZE + Math.max(0, c - 1));
      else if (e.key === "ArrowRight") setSel(r * SIZE + Math.min(SIZE - 1, c + 1));
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  const stat = (label: string, value: string | number, warn = false) => (
    <div className={`rounded-lg border bg-card/90 px-2 py-3 text-center ${warn ? "text-destructive" : "text-foreground"}`}>
      <div className="font-mono text-[10px] uppercase text-muted-foreground sm:text-xs">{label}</div>
      <div className="mt-1 font-mono text-xl font-bold tabular-nums sm:text-3xl">{value}</div>
    </div>
  );

  return (
    <div className="flex flex-1 flex-col items-center gap-4">
      <div className="grid w-full max-w-xl grid-cols-4 gap-2">
        {stat("Czas", `${Math.floor(timeLeft / 60).toString().padStart(2, "0")}:${(timeLeft % 60).toString().padStart(2, "0")}`, timeLeft <= 10)}
        {stat("Wynik", score)}
        {stat("Seria", `×${streak}`)}
        {stat("Pakiet", `#${delivered + 1}`)}
      </div>

      <p role="status" className={`min-h-8 text-center text-base font-semibold ${status === "fail" ? "text-destructive" : status === "ok" ? "text-success" : "text-muted-foreground"}`}>
        {status === "fail" ? "✕ " : status === "ok" ? "✓ " : ""}{msg}
      </p>

      <div className="flex w-full max-w-xl items-stretch gap-1 sm:gap-2">
        <Side row={puzzle.source} label="START" icon="▶" tone="bg-accent text-accent-foreground" />
        <div className={`grid min-w-0 flex-1 grid-cols-5 gap-1 rounded-lg border bg-secondary p-1.5 sm:gap-1.5 ${status === "fail" ? "anim-shake" : status === "ok" ? "anim-ok" : ""}`}>
          {puzzle.tiles.map((t, i) => (
            <Button
              key={i}
              aria-label={`Kafelek ${Math.floor(i / SIZE) + 1}-${(i % SIZE) + 1}`}
              onClick={() => turn(i)}
              variant="ghost"
              className={`relative h-auto min-w-0 aspect-square rounded-md border bg-tile p-0 hover:bg-tile [&_svg]:h-full [&_svg]:w-full ${i === sel ? "ring-2 ring-ring" : ""}`}
            >
              <TileSvg mask={t} lit={route.includes(i)} />
              {packetAt === i && <span className="absolute inset-0 m-auto h-1/3 w-1/3 rounded-md bg-accent shadow-lg ring-4 ring-background" />}
            </Button>
          ))}
        </div>
        <Side row={puzzle.target} label="CEL" icon="◎" tone="bg-primary text-primary-foreground" />
      </div>

      <div className="flex w-full max-w-xl flex-wrap justify-center gap-3">
        <Button variant="arcade" size="xl" className="flex-1" onClick={send} disabled={busy}><Send /> Wyślij pakiet</Button>
        <Button variant="arcadeGhost" size="xl" onClick={skip} disabled={busy}><RotateCcw /> Poddaj zagadkę</Button>
      </div>
      <p className="font-mono text-xs text-muted-foreground">Klawiatura: strzałki — wybór, spacja — obrót, Enter — wyślij</p>
    </div>
  );
}

function Side({ row, label, icon, tone }: { row: number; label: string; icon: string; tone: string }) {
  return (
    <div className="grid w-9 grid-rows-5 gap-1 py-1.5 sm:w-14 sm:gap-1.5">
      {Array.from({ length: SIZE }, (_, r) => (
        <div key={r} className="flex items-center justify-center">
          {r === row && (
            <div className={`flex h-full w-full flex-col items-center justify-center rounded-md font-bold ${tone}`}>
              <span className="text-lg sm:text-2xl">{icon}</span>
              <span className="text-[9px] sm:text-xs">{label}</span>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function EndScreen({ result, scores, onSaved, onAgain }: {
  result: Result; scores: Entry[]; onSaved: (s: Entry[]) => void; onAgain: () => void;
}) {
  const [nick, setNick] = useState("");
  const [state, setState] = useState<"idle" | "saved" | "error">("idle");
  const [err, setErr] = useState("");
  const [savedAt, setSavedAt] = useState<number>();

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const v = validateNick(nick);
    if (!v) { setState("error"); setErr("Pseudonim musi mieć od 2 do 16 znaków."); return; }
    try {
      const at = Date.now();
      onSaved(saveScore({ nick: v, score: result.score, at }));
      setSavedAt(at); setState("saved");
    } catch {
      setState("error"); setErr("Nie udało się zapisać wyniku. Możesz grać dalej.");
    }
  };

  return (
    <div className="grid flex-1 items-start gap-8 lg:grid-cols-[1fr_22rem]">
      <div className="flex flex-col gap-6">
        <h2 className="font-display text-5xl font-bold text-warning sm:text-6xl">Koniec czasu!</h2>
        <div className="flex flex-wrap gap-6 font-mono">
          <div><div className="text-xs text-muted-foreground">WYNIK</div><div className="text-7xl font-bold text-primary">{result.score}<span className="text-2xl text-muted-foreground"> pkt</span></div></div>
          <div><div className="text-xs text-muted-foreground">PAKIETY</div><div className="text-4xl font-bold">{result.delivered}</div></div>
          <div><div className="text-xs text-muted-foreground">NAJLEPSZA SERIA</div><div className="text-4xl font-bold">×{result.bestStreak}</div></div>
        </div>
        {state !== "saved" ? (
          <form onSubmit={submit} className="flex max-w-md flex-col gap-2">
            <label htmlFor="pr-nick" className="text-sm text-muted-foreground">Twój pseudonim (2–16 znaków)</label>
            <div className="flex gap-2">
              <input
                id="pr-nick" autoFocus value={nick} maxLength={24} autoComplete="off" onChange={(e) => setNick(e.target.value)}
                className="h-14 flex-1 rounded-lg border bg-input/30 px-3 text-lg focus-visible:outline-2 focus-visible:outline-ring"
              />
              <Button type="submit" variant="arcade" size="xl"><Save /> Zapisz wynik</Button>
            </div>
            {state === "error" && <p role="alert" className="text-sm text-destructive">{err}</p>}
          </form>
        ) : (
          <p className="text-xl text-accent" role="status">✓ Wynik zapisany!</p>
        )}
        <div><Button variant="arcade" size="xl" onClick={onAgain}><RotateCcw /> Zagraj ponownie</Button></div>
        <Recruit />
      </div>
      <Leaderboard scores={scores} highlight={savedAt} />
    </div>
  );
}
