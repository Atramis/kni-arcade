import { useEffect, useState, type FormEvent } from "react";
import { Lock, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { STORAGE_KEYS, readList, exportScores } from "@/lib/local-scores";
import {
  hasPassword, setPassword, verifyPassword, validateNewPassword, resetRankings, type GameKey, MIN_PASSWORD,
} from "@/lib/admin-auth";

type View = "setup" | "login" | "panel" | "change";
const NAMES: Record<GameKey, string> = { memoryLeak: "Memory Leak", packetRouter: "Packet Router", stackOverflow: "Stack_Overflow" };
const SLUGS: Record<GameKey, string> = { memoryLeak: "memory-leak", packetRouter: "packet-router", stackOverflow: "stack-overflow" };

export function AdminMenu({ onChanged }: { onChanged: () => void }) {
  const [open, setOpen] = useState(false);
  const [view, setView] = useState<View>("login");
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [counts, setCounts] = useState<Record<GameKey, number>>({ memoryLeak: 0, packetRouter: 0, stackOverflow: 0 });
  const [confirm, setConfirm] = useState<GameKey[] | null>(null);

  const refreshCounts = () =>
    setCounts({
      memoryLeak: readList(STORAGE_KEYS.memoryLeak).length,
      packetRouter: readList(STORAGE_KEYS.packetRouter).length,
      stackOverflow: readList(STORAGE_KEYS.stackOverflow).length,
    });

  useEffect(() => {
    if (!open) return;
    const h = () => refreshCounts();
    window.addEventListener("storage", h);
    return () => window.removeEventListener("storage", h);
  }, [open]);

  const openMenu = () => {
    setError(null); setNotice(null);
    try {
      setView(hasPassword() ? "login" : "setup");
    } catch {
      setView("login");
      setError("Brak dostępu do pamięci przeglądarki (localStorage).");
    }
    setOpen(true);
  };

  // Closing always locks: unlocked state lives only in this component.
  const close = () => { setOpen(false); setView("login"); setConfirm(null); setError(null); setNotice(null); };

  const run = async (fn: () => Promise<void>) => {
    setBusy(true); setError(null); setNotice(null);
    try { await fn(); } catch (e) { setError(e instanceof Error ? e.message : "Operacja nie powiodła się."); }
    finally { setBusy(false); }
  };

  const onSetup = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const pw = String(f.get("pw")), rep = String(f.get("rep"));
    run(async () => {
      const err = validateNewPassword(pw, rep);
      if (err) throw new Error(err);
      await setPassword(pw);
      refreshCounts(); setView("panel"); setNotice("Hasło ustawione.");
    });
  };

  const onLogin = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const pw = String(new FormData(e.currentTarget).get("pw"));
    run(async () => {
      if (!(await verifyPassword(pw))) throw new Error("Błędne hasło. Spróbuj ponownie.");
      refreshCounts(); setView("panel");
    });
  };

  const onChange = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const cur = String(f.get("cur")), pw = String(f.get("pw")), rep = String(f.get("rep"));
    run(async () => {
      if (!(await verifyPassword(cur))) throw new Error("Obecne hasło jest błędne.");
      const err = validateNewPassword(pw, rep);
      if (err) throw new Error(err);
      await setPassword(pw);
      setView("panel"); setNotice("Hasło zostało zmienione.");
    });
  };

  const doReset = () => {
    if (!confirm) return;
    const games = confirm;
    setConfirm(null);
    run(async () => {
      resetRankings(games);
      refreshCounts(); onChanged();
      setNotice(`Usunięto wyniki: ${games.map((g) => NAMES[g]).join(" i ")}.`);
    });
  };

  const confirmCount = confirm ? confirm.reduce((s, g) => s + counts[g], 0) : 0;

  return (
    <>
      <button type="button" onClick={openMenu}
        className="inline-flex items-center gap-1.5 rounded px-2 py-1 font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground/70 hover:text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-ring">
        <Lock className="h-3.5 w-3.5" aria-hidden /> Administrator
      </button>

      <Dialog open={open} onOpenChange={(o) => (o ? setOpen(true) : close())}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Menu administratora</DialogTitle>
            <DialogDescription>
              {view === "setup" && "Ustaw hasło organizatora przed udostępnieniem laptopa odwiedzającym."}
              {view === "login" && "Podaj hasło, aby odblokować panel."}
              {view === "panel" && "Panel odblokowany. Zamknięcie okna ponownie blokuje dostęp."}
              {view === "change" && "Zmiana hasła wymaga podania obecnego hasła."}
            </DialogDescription>
          </DialogHeader>

          {error && <p role="alert" className="rounded border border-destructive/60 bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>}
          {notice && <p role="status" className="rounded border border-primary/50 bg-primary/10 px-3 py-2 text-sm">{notice}</p>}

          {view === "setup" && (
            <form onSubmit={onSetup} className="grid gap-3">
              <Field id="adm-pw" name="pw" label={`Nowe hasło (min. ${MIN_PASSWORD} znaków)`} autoFocus />
              <Field id="adm-rep" name="rep" label="Powtórz hasło" />
              <Button type="submit" variant="arcade" disabled={busy}>Ustaw hasło</Button>
            </form>
          )}

          {view === "login" && (
            <form onSubmit={onLogin} className="grid gap-3">
              <Field id="adm-login" name="pw" label="Hasło" autoFocus />
              <div className="flex justify-end gap-2">
                <Button type="button" variant="ghost" onClick={close}>Zamknij</Button>
                <Button type="submit" variant="arcade" disabled={busy}>Odblokuj</Button>
              </div>
            </form>
          )}

          {view === "panel" && (
            <div className="grid gap-3">
              <ul className="grid gap-1 font-mono text-sm">
                {(Object.keys(NAMES) as GameKey[]).map((g) => (
                  <li key={g} className="flex justify-between"><span>{NAMES[g]}</span><span>zapisane wyniki: {counts[g]}</span></li>
                ))}
              </ul>
              <Button variant="outline" onClick={() => setConfirm(["memoryLeak"])} disabled={busy}>Resetuj ranking Memory Leak</Button>
              <Button variant="outline" onClick={() => setConfirm(["packetRouter"])} disabled={busy}>Resetuj ranking Packet Router</Button>
              <Button variant="outline" onClick={() => setConfirm(["stackOverflow"])} disabled={busy}>Resetuj ranking Stack_Overflow</Button>
              <Button variant="outline" onClick={() => setConfirm(["memoryLeak", "packetRouter", "stackOverflow"])} disabled={busy}>Resetuj wszystkie rankingi</Button>
              <Button variant="ghost" onClick={() => { setView("change"); setNotice(null); setError(null); }}>Zmień hasło</Button>
              <Button variant="arcade" onClick={close}><Lock /> Zablokuj i zamknij</Button>
            </div>
          )}

          {view === "change" && (
            <form onSubmit={onChange} className="grid gap-3">
              <Field id="adm-cur" name="cur" label="Obecne hasło" autoFocus />
              <Field id="adm-new" name="pw" label={`Nowe hasło (min. ${MIN_PASSWORD} znaków)`} />
              <Field id="adm-new2" name="rep" label="Powtórz nowe hasło" />
              <div className="flex justify-end gap-2">
                <Button type="button" variant="ghost" onClick={() => { setView("panel"); setError(null); }}>Anuluj</Button>
                <Button type="submit" variant="arcade" disabled={busy}>Zapisz hasło</Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!confirm} onOpenChange={(o) => !o && setConfirm(null)}>
        <AlertDialogContent className="z-[60] border bg-card shadow-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Reset: {confirm?.map((g) => NAMES[g]).join(" i ")}</AlertDialogTitle>
            <AlertDialogDescription>
              Liczba usuwanych wyników: <strong>{confirmCount}</strong>. Usuniesz zapisane wyniki. Tej operacji nie można cofnąć.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex flex-wrap gap-2">
            {confirm?.map((g) => (
              <Button key={g} size="sm" variant="outline" onClick={() => exportScores(STORAGE_KEYS[g], SLUGS[g])}>
                <Download /> Eksport JSON — {NAMES[g]}
              </Button>
            ))}
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel autoFocus>Anuluj</AlertDialogCancel>
            <AlertDialogAction onClick={doReset} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Usuń wyniki
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

function Field({ id, name, label, autoFocus }: { id: string; name: string; label: string; autoFocus?: boolean }) {
  return (
    <div className="grid gap-1.5">
      <Label htmlFor={id}>{label}</Label>
      <Input id={id} name={name} type="password" autoComplete="off" required autoFocus={autoFocus} />
    </div>
  );
}
