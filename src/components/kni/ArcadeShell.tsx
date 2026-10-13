import { Link } from "@tanstack/react-router";
import { useEffect, useState, type ReactNode } from "react";
import { ArrowLeft, Maximize } from "lucide-react";
import { Button } from "@/components/ui/button";
import { KNI_CONFIG } from "@/config/kni";

/** Wspólna rama KNI Arcade: pasek terminala, przycisk powrotu, stopka. */
export function ArcadeShell({ label, footerLabel, back = true, children }: {
  label: string; footerLabel: string; back?: boolean; children: ReactNode;
}) {
  const [fsOk, setFsOk] = useState(false);
  useEffect(() => setFsOk(!!document.fullscreenEnabled), []);
  return (
    <main className="mx-auto flex min-h-screen max-w-6xl flex-col gap-6 px-4 py-6">
      <div className="terminal-bar flex flex-wrap items-center justify-between gap-3 rounded-2xl border bg-card/60 px-5 py-3">
        <div className="flex min-w-0 items-center gap-3">
          <span className="flex gap-1.5" aria-hidden>
            <span className="h-2.5 w-2.5 rounded-[2px] bg-accent" />
            <span className="h-2.5 w-2.5 rounded-[2px] bg-primary" />
          </span>
          <span className="truncate font-mono text-xs uppercase tracking-[0.25em] text-muted-foreground sm:text-sm">
            TERMINAL://{label}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {back && (
            <Button asChild variant="arcadeGhost" size="sm">
              <Link to="/"><ArrowLeft /> Wróć do wyboru gier</Link>
            </Button>
          )}
          {fsOk && (
            <Button variant="ghost" size="sm"
              onClick={() => (document.fullscreenElement ? document.exitFullscreen() : document.documentElement.requestFullscreen())}>
              <Maximize /> Pełny ekran
            </Button>
          )}
          <span className="hidden items-center gap-2 font-mono text-xs uppercase tracking-[0.25em] text-accent sm:flex" role="status">
            <span className="h-2.5 w-2.5 rounded-[2px] bg-accent" aria-hidden /> SYSTEM ONLINE
          </span>
        </div>
      </div>
      <p className="font-mono text-xs uppercase tracking-[0.3em] text-muted-foreground">{KNI_CONFIG.shortName} presents</p>
      {children}
      <footer className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border bg-card/40 px-6 py-5 font-mono text-xs uppercase tracking-[0.25em] text-muted-foreground">
        <span>KNI // {KNI_CONFIG.organizationName.toUpperCase()}</span>
        <span>{footerLabel}</span>
      </footer>
    </main>
  );
}

export function Recruit() {
  return (
    <aside className="rounded-lg border border-accent/40 bg-card/70 p-4">
      <p className="font-semibold text-accent">Chcesz tworzyć takie gry?</p>
      <p className="text-sm text-muted-foreground">Dołącz do {KNI_CONFIG.organizationName}.</p>
    </aside>
  );
}
