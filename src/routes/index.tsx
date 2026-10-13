import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Cpu, Network, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ArcadeShell, Recruit } from "@/components/kni/ArcadeShell";
import { loadMemoryScores } from "@/games/memory-leak/leaderboard";
import { formatMs } from "@/games/memory-leak/engine";
import { loadScores, type Entry as PacketEntry } from "@/games/packet-router/leaderboard";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "KNI Arcade — gry Koła Naukowego Informatyki" },
      { name: "description", content: "Wybierz grę na stoisku KNI: Memory Leak lub Packet Router. Zagraj i walcz o miejsce w rankingu." },
      { property: "og:title", content: "KNI Arcade" },
      { property: "og:description", content: "Dwie gry Koła Naukowego Informatyki: Memory Leak i Packet Router." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Home,
});

const GAMES = [
  { to: "/gry/memory-leak", kind: "memory-leak" as const, name: "Memory", accent: "Leak", icon: Cpu, tagline: "Ile RAM-u masz w głowie?",
    desc: "Zapamiętaj podświetlone pola i odtwórz wzór. 60 sekund, 3 życia, 10 poziomów.", rank: "Ranking: poziom → błędy → czas" },
  { to: "/gry/packet-router", kind: "packet-router" as const, name: "Packet", accent: "Router", icon: Network, tagline: "Sieciowy kurier",
    desc: "Obracaj kafelki i dostarcz pakiet do celu. 2 minuty, +10 s za każdą zagadkę.", rank: "Ranking: punkty" },
] as const;

type RankedMemory = ReturnType<typeof loadMemoryScores>;

function Home() {
  const [memoryScores, setMemoryScores] = useState<RankedMemory>([]);
  const [packetScores, setPacketScores] = useState<PacketEntry[]>([]);
  useEffect(() => {
    setMemoryScores(loadMemoryScores());
    setPacketScores(loadScores());
  }, []);

  return (
    <ArcadeShell label="KNI_ARCADE" footerLabel="KNI ARCADE_ / WYBÓR GRY" back={false}>
      <div>
        <h1 className="game-title font-display font-bold leading-none">KNI<span className="text-primary">_</span>Arcade</h1>
        <p className="mt-3 text-xl text-accent sm:text-2xl">Wybierz grę i pobij rekord stoiska</p>
      </div>
      <div className="grid gap-6 md:grid-cols-2">
        {GAMES.map((g) => (
          <article key={g.to} className="flex flex-col gap-4 rounded-2xl border bg-card/80 p-6 transition hover:border-primary">
            <g.icon className="h-10 w-10 text-primary" aria-hidden />
            <div>
              <h2 className="font-display text-4xl font-bold">{g.name}<span className="text-primary">_</span>{g.accent}</h2>
              <p className="mt-1 text-lg text-accent">{g.tagline}</p>
            </div>
            <p className="flex-1 text-muted-foreground">{g.desc}</p>
            <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground">{g.rank}</p>
            {g.kind === "memory-leak" ? <MemoryTop5 rows={memoryScores} /> : <PacketTop5 rows={packetScores} />}
            <Button asChild variant="arcade" size="hero"><Link to={g.to}>Zagraj</Link></Button>
          </article>
        ))}
      </div>
      <Recruit />
    </ArcadeShell>
  );
}

function Top5Header() {
  return (
    <h3 className="flex items-center gap-2 font-mono text-xs font-semibold uppercase tracking-widest text-primary">
      <Trophy className="h-3.5 w-3.5" aria-hidden /> Top 5
    </h3>
  );
}

function MemoryTop5({ rows }: { rows: RankedMemory }) {
  const top = rows.slice(0, 5);
  return (
    <section aria-label="Top 5 — Memory Leak" className="rounded-lg border bg-background/40 p-3">
      <Top5Header />
      {top.length === 0 ? (
        <p className="mt-2 text-sm text-muted-foreground">Ranking pusty — zagraj jako pierwszy!</p>
      ) : (
        <ol className="mt-2 space-y-1 font-mono text-sm">
          {top.map((r) => (
            <li key={r.id} className="flex items-baseline gap-2">
              <span className="w-5 shrink-0 text-right text-muted-foreground">{r.place}.</span>
              <span className="min-w-0 flex-1 truncate font-sans">{r.nick}</span>
              <span className="shrink-0 text-accent">poz. {r.level}</span>
              <span className="shrink-0 text-muted-foreground">{r.errors} bł. · {formatMs(r.time_ms)}</span>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}

function PacketTop5({ rows }: { rows: PacketEntry[] }) {
  const top = rows.slice(0, 5);
  return (
    <section aria-label="Top 5 — Packet Router" className="rounded-lg border bg-background/40 p-3">
      <Top5Header />
      {top.length === 0 ? (
        <p className="mt-2 text-sm text-muted-foreground">Ranking pusty — zagraj jako pierwszy!</p>
      ) : (
        <ol className="mt-2 space-y-1 font-mono text-sm">
          {top.map((r, i) => (
            <li key={`${r.at}-${i}`} className="flex items-baseline gap-2">
              <span className="w-5 shrink-0 text-right text-muted-foreground">{i + 1}.</span>
              <span className="min-w-0 flex-1 truncate font-sans">{r.nick}</span>
              <span className="shrink-0 text-accent">{r.score} pkt</span>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
