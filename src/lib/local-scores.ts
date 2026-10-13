// Lokalny zapis wyników (tryb stoiskowy, bez internetu). Każda gra ma własny klucz.
export const STORAGE_KEYS = {
  memoryLeak: "kni-arcade:memory-leak:scores",
  packetRouter: "kni-arcade:packet-router:scores",
} as const;

export function readList<T>(key: string): T[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = JSON.parse(window.localStorage.getItem(key) || "[]");
    return Array.isArray(raw) ? (raw as T[]) : [];
  } catch {
    return [];
  }
}

/** May throw (quota / private mode) — callers show an error. */
export function writeList<T>(key: string, list: T[]) {
  window.localStorage.setItem(key, JSON.stringify(list));
}

export const newId = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`;

/** Kopia zapasowa: pobiera wyniki danej gry jako plik JSON. */
export function exportScores(key: string, game: string) {
  const payload = { app: "KNI Arcade", game, exportedAt: new Date().toISOString(), scores: readList(key) };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `kni-arcade-${game}-${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
