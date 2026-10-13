import { createFileRoute, Link } from "@tanstack/react-router";
import { Cpu, Network } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ArcadeShell, Recruit } from "@/components/kni/ArcadeShell";

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
  { to: "/gry/memory-leak", name: "Memory", accent: "Leak", icon: Cpu, tagline: "Ile RAM-u masz w głowie?",
    desc: "Zapamiętaj podświetlone pola i odtwórz wzór. 60 sekund, 3 życia, 10 poziomów.", rank: "Ranking: poziom → błędy → czas" },
  { to: "/gry/packet-router", name: "Packet", accent: "Router", icon: Network, tagline: "Sieciowy kurier",
    desc: "Obracaj kafelki i dostarcz pakiet do celu. 2 minuty, +10 s za każdą zagadkę.", rank: "Ranking: punkty" },
] as const;

function Home() {
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
            <Button asChild variant="arcade" size="hero"><Link to={g.to}>Zagraj</Link></Button>
          </article>
        ))}
      </div>
      <Recruit />
    </ArcadeShell>
  );
}
