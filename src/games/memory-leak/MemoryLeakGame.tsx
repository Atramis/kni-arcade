import { useEffect, useState } from "react";
import { Heart, HeartCrack, Cpu, Timer, Eye, MousePointerClick, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ArcadeShell, Recruit } from "@/components/kni/ArcadeShell";
import { Board } from "./Board";
import { useMemoryGame, type EndReason } from "./useMemoryGame";
import { START_LIVES, cellsForLevel, formatMs, validateNick } from "./engine";
import { loadMemoryScores, saveMemoryScore } from "./leaderboard";

type Ranked = ReturnType<typeof loadMemoryScores>;

export function MemoryLeakGame() {
  const game = useMemoryGame();
  const { state } = game;
  const [howTo, setHowTo] = useState(false);
  const [scores, setScores] = useState<Ranked>([]);
  useEffect(() => setScores(loadMemoryScores()), []);

  return (
    <ArcadeShell label="MEMORY_LEAK" footerLabel="MEMORY LEAK_ / ARCADE">
      {state.phase === "start" ? (
        <StartScreen onPlay={game.start} howTo={howTo} setHowTo={setHowTo} scores={scores} />
      ) : state.phase === "finished" ? (
        <EndScreen
          key={state.runId}
          reason={state.endReason!}
          level={state.bestLevel}
          errors={state.errors}
          timeMs={state.bestTimeMs}
          scores={scores}
          onSaved={() => setScores(loadMemoryScores())}
          onReplay={game.start}
          onHome={game.reset}
        />
      ) : (
        <PlayScreen game={game} scores={scores} />
      )}
    </ArcadeShell>
  );
}

function Title({ big }: { big?: boolean }) {
  return (
    <div>
      <h1 className={`font-display font-bold leading-none ${big ? "game-title" : "text-3xl"}`}>
        Memory<span className="text-primary">_</span>Leak
      </h1>
      {big && <p className="mt-3 text-xl text-accent sm:text-2xl">Ile RAM-u masz w głowie?</p>}
    </div>
  );
}

function Leaderboard({ scores, highlightId, own, compact }: {
  scores: Ranked; highlightId?: string | null; compact?: boolean;
  own?: { place: number; nick: string; level: number; errors: number; time_ms: number | null } | null;
}) {
  const rows = scores.slice(0, 10);
  const ownInTop = own && highlightId && rows.some((r) => r.id === highlightId);
  return (
    <section aria-labelledby="lb-ml" className="rounded-lg border bg-card/80 p-4">
      <div className="mb-3 flex items-center justify-between gap-2">
        <h2 id="lb-ml" className="flex items-center gap-2 font-mono text-sm font-semibold uppercase tracking-widest text-primary">
          <Trophy className="h-4 w-4" aria-hidden /> Top 10
        </h2>
        <span className="text-xs text-muted-foreground">lokalny — to urządzenie</span>
      </div>
      {rows.length === 0 ? (
        <p className="text-sm text-muted-foreground">Ranking jest pusty — bądź pierwszy!</p>
      ) : (
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs text-muted-foreground">
              <th className="pb-1 font-normal">#</th>
              <th className="pb-1 font-normal">Nick</th>
              <th className="pb-1 text-right font-normal">Poz.</th>
              <th className="pb-1 text-right font-normal">Błędy</th>
              {!compact && <th className="pb-1 text-right font-normal">Czas</th>}
            </tr>
          </thead>
          <tbody className="font-mono">
            {rows.map((r) => {
              const mine = r.id === highlightId;
              return (
                <tr key={r.id} className={mine ? "bg-accent/15 text-accent" : ""}>
                  <td className="py-1 pr-2">{r.place}</td>
                  <td className="max-w-[9rem] truncate py-1 font-sans">{mine ? "▶ " : ""}{r.nick}</td>
                  <td className="py-1 text-right">{r.level}</td>
                  <td className="py-1 text-right">{r.errors}</td>
                  {!compact && <td className="py-1 text-right">{formatMs(r.time_ms)}</td>}
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
      {own && !ownInTop && (
        <p className="mt-3 border-t pt-3 font-mono text-sm text-accent">
          ▶ {own.place}. {own.nick} — poziom {own.level}, błędy {own.errors}, {formatMs(own.time_ms)}
        </p>
      )}
    </section>
  );
}

function StartScreen({ onPlay, howTo, setHowTo, scores }: { onPlay: () => void; howTo: boolean; setHowTo: (v: boolean) => void; scores: Ranked }) {
  return (
    <div className="grid flex-1 items-start gap-8 lg:grid-cols-[1fr_22rem]">
      <div className="flex flex-col gap-6">
        <Title big />
        <p className="max-w-xl text-lg text-muted-foreground">
          Zapamiętaj podświetlone pola. Gdy zgasną, wskaż je wszystkie.
          <br />
          Masz <b className="font-mono text-foreground">60 sekund</b> i <b className="font-mono text-foreground">3 życia</b>. Jak daleko dojdziesz?
        </p>
        <div className="flex flex-wrap gap-3">
          <Button variant="arcade" size="hero" onClick={onPlay} autoFocus>Zagraj</Button>
          <Button variant="arcadeGhost" size="hero" onClick={() => setHowTo(!howTo)} aria-expanded={howTo}>Jak grać?</Button>
        </div>
        {howTo && (
          <ol className="max-w-xl space-y-2 rounded-lg border bg-card/80 p-4 text-sm">
            <li><Eye className="mr-2 inline h-4 w-4 text-primary" aria-hidden />Przez 2 sekundy zobaczysz podświetlone komórki pamięci.</li>
            <li><MousePointerClick className="mr-2 inline h-4 w-4 text-accent" aria-hidden />Kliknij je wszystkie w dowolnej kolejności.</li>
            <li><HeartCrack className="mr-2 inline h-4 w-4 text-destructive" aria-hidden />Złe pole = utrata życia i nowy wzór na tym samym poziomie.</li>
            <li><Cpu className="mr-2 inline h-4 w-4 text-primary" aria-hidden />Poziom 1 to 3 pola, każdy kolejny o jedno więcej — aż do 12 na poziomie 10.</li>
            <li><Timer className="mr-2 inline h-4 w-4 text-warning" aria-hidden />Zegar 60 s biegnie przez całą grę. Za każdy ułożony wzór dostajesz +4 s.</li>
          </ol>
        )}
        <Recruit />
      </div>
      <Leaderboard scores={scores} />
    </div>
  );
}

function PlayScreen({ game, scores }: { game: ReturnType<typeof useMemoryGame>; scores: Ranked }) {
  const { state, remainingMs, pick } = game;
  const secs = Math.ceil(remainingMs / 1000);
  const low = secs <= 10;
  const stage =
    state.phase === "memorizing" ? "Zapamiętaj układ" :
    state.phase === "recalling" ? "Odtwórz układ" :
    state.phase === "feedback" ? (state.feedback === "success" ? "Pamięć przydzielona!" : "Segmentation fault!") : "";

  return (
    <div className="grid flex-1 items-start gap-6 lg:grid-cols-[1fr_18rem]">
      <div className="mx-auto flex w-full max-w-[min(36rem,70vh)] flex-col gap-4">
        <div className="grid grid-cols-3 items-center rounded-lg border bg-card/80 px-4 py-3 font-mono">
          <div>
            <div className="text-xs text-muted-foreground">POZIOM</div>
            <div className="text-2xl font-bold">{state.level}<span className="text-muted-foreground">/10</span></div>
          </div>
          <div className="text-center" aria-live="off">
            <div className="text-xs text-muted-foreground">CZAS</div>
            <div className={`text-3xl font-bold tabular-nums ${low ? "animate-warn text-warning" : ""}`}>
              {low && <Timer className="mr-1 inline h-5 w-5" aria-hidden />}{secs}s
            </div>
          </div>
          <div className="flex justify-end gap-1" aria-label={`Życia: ${state.lives} z ${START_LIVES}`} role="img">
            {Array.from({ length: START_LIVES }, (_, i) =>
              i < state.lives
                ? <Heart key={i} className="h-7 w-7 fill-destructive text-destructive" aria-hidden />
                : <HeartCrack key={i} className="h-7 w-7 text-muted-foreground" aria-hidden />,
            )}
          </div>
        </div>

        {state.phase === "countdown" ? (
          <div className="flex aspect-square items-center justify-center rounded-lg border bg-card/50">
            <span key={state.countdown} className="animate-count font-mono text-9xl font-bold text-primary">{state.countdown}</span>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between" aria-live="polite">
              <span className={`text-xl font-semibold ${state.feedback === "fail" ? "text-destructive" : state.phase === "recalling" ? "text-accent" : "text-primary"}`}>
                {state.phase === "memorizing" && <Eye className="mr-2 inline h-5 w-5" aria-hidden />}
                {state.phase === "recalling" && <MousePointerClick className="mr-2 inline h-5 w-5" aria-hidden />}
                {stage}
              </span>
              {state.phase === "recalling" && (
                <span className="font-mono text-sm">Wybrane: {state.picked.size} / {cellsForLevel(state.level)}</span>
              )}
            </div>
            <div className="h-1.5 overflow-hidden rounded bg-muted">
              {state.phase === "memorizing" && (
                <div key={[...state.pattern].join()} className="animate-drain h-full bg-primary" />
              )}
            </div>
            <Board state={state} onPick={pick} />
          </>
        )}
        <p className="text-center font-mono text-xs text-muted-foreground">Błędy: {state.errors}</p>
      </div>
      <div className="hidden lg:block"><Leaderboard scores={scores} compact /></div>
    </div>
  );
}

const TITLES: Record<EndReason, string> = {
  lives: "Memory overflow!",
  time: "Czas minął!",
  win: "Pamięć doskonała!",
  aborted: "Próba przerwana",
};

function EndScreen(props: {
  reason: EndReason; level: number; errors: number; timeMs: number | null; scores: Ranked;
  onSaved: () => void; onReplay: () => void; onHome: () => void;
}) {
  const { reason, level, errors, timeMs } = props;
  const [nick, setNick] = useState("");
  const [status, setStatus] = useState<"idle" | "saved" | "error">("idle");
  const [err, setErr] = useState("");
  const [saved, setSaved] = useState<{ id: string; rank: number; nick: string } | null>(null);
  const aborted = reason === "aborted";
  const time = level > 0 ? timeMs : null;

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = validateNick(nick);
    if (!clean) { setErr("Nick musi mieć od 2 do 20 znaków."); return; }
    setErr("");
    try {
      const res = saveMemoryScore({ nick: clean, level, errors, time_ms: time });
      setSaved({ ...res, nick: clean });
      setStatus("saved");
      props.onSaved();
    } catch {
      setStatus("error");
      setErr("Nie udało się zapisać wyniku na tym urządzeniu. Możesz grać dalej.");
    }
  };

  return (
    <div className="grid flex-1 items-start gap-8 lg:grid-cols-[1fr_22rem]">
      <div className="flex flex-col gap-6">
        <Title />
        <h2 className={`font-display text-5xl font-bold sm:text-6xl ${reason === "win" ? "text-accent" : reason === "time" ? "text-warning" : "text-destructive"}`}>
          {TITLES[reason]}
        </h2>
        {aborted ? (
          <p className="text-lg text-muted-foreground">Opuszczono kartę podczas gry, więc ta próba nie trafi do rankingu. Zacznij od nowa!</p>
        ) : (
          <>
            <div className="flex flex-wrap gap-6 font-mono">
              <div><div className="text-xs text-muted-foreground">UKOŃCZONY POZIOM</div><div className="text-7xl font-bold text-primary">{level}</div></div>
              <div><div className="text-xs text-muted-foreground">BŁĘDY</div><div className="text-4xl font-bold">{errors}</div></div>
              {level > 0 && <div><div className="text-xs text-muted-foreground">CZAS WYNIKU</div><div className="text-4xl font-bold">{formatMs(timeMs)}</div></div>}
            </div>
            {status === "saved" && saved ? (
              <p className="text-xl text-accent" role="status">Zapisano! Twoje miejsce w rankingu: <b className="font-mono">{saved.rank}</b></p>
            ) : (
              <form onSubmit={submit} className="flex max-w-md flex-col gap-2">
                <label htmlFor="nick" className="text-sm text-muted-foreground">Twój nick (2–20 znaków)</label>
                <div className="flex gap-2">
                  <input
                    id="nick" value={nick} maxLength={40} autoComplete="off"
                    onChange={(e) => setNick(e.target.value)}
                    className="h-14 flex-1 rounded-lg border bg-input/30 px-3 text-lg focus-visible:outline-2 focus-visible:outline-ring"
                  />
                  <Button type="submit" variant="arcade" size="xl">Zapisz wynik</Button>
                </div>
                {err && <p role="alert" className="text-sm text-destructive">{err}</p>}
              </form>
            )}
          </>
        )}
        <div className="flex flex-wrap gap-3">
          <Button variant="arcade" size="xl" onClick={props.onReplay}>Zagraj ponownie</Button>
          <Button variant="arcadeGhost" size="xl" onClick={props.onHome}>Ekran startowy gry</Button>
        </div>
        <Recruit />
      </div>
      <Leaderboard
        scores={props.scores}
        highlightId={saved?.id ?? null}
        own={saved ? { place: saved.rank, nick: saved.nick, level, errors, time_ms: time } : null}
      />
    </div>
  );
}
