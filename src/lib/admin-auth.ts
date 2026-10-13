// Lokalna blokada menu administratora (stoisko, offline).
// Zapisujemy tylko weryfikator PBKDF2 (losowa sól), nigdy hasła.
import { STORAGE_KEYS } from "./local-scores";

export const ADMIN_KEY = "kni-arcade:admin:verifier";
export const SCORES_CHANGED_EVENT = "kni-arcade:scores-changed";
export const MIN_PASSWORD = 8;
const ITERATIONS = 210_000;

type Verifier = { v: 1; alg: "PBKDF2-SHA256"; iterations: number; salt: string; hash: string };

const toB64 = (b: Uint8Array) => btoa(String.fromCharCode(...b));
const fromB64 = (s: string) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0));

async function derive(password: string, salt: Uint8Array, iterations: number) {
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(password), "PBKDF2", false, ["deriveBits"]);
  const bits = await crypto.subtle.deriveBits({ name: "PBKDF2", hash: "SHA-256", salt: salt as BufferSource, iterations }, key, 256);
  return new Uint8Array(bits);
}

function readVerifier(): Verifier | null {
  const raw = window.localStorage.getItem(ADMIN_KEY);
  if (!raw) return null;
  try {
    const v = JSON.parse(raw) as Verifier;
    return v && v.salt && v.hash ? v : null;
  } catch {
    return null;
  }
}

/** Throws when localStorage is unavailable. */
export function hasPassword(): boolean {
  return readVerifier() !== null;
}

export function validateNewPassword(pw: string, repeat: string): string | null {
  if (pw.length < MIN_PASSWORD) return `Hasło musi mieć co najmniej ${MIN_PASSWORD} znaków.`;
  if (pw !== repeat) return "Hasła nie są zgodne.";
  return null;
}

export async function setPassword(pw: string) {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const hash = await derive(pw, salt, ITERATIONS);
  const v: Verifier = { v: 1, alg: "PBKDF2-SHA256", iterations: ITERATIONS, salt: toB64(salt), hash: toB64(hash) };
  window.localStorage.setItem(ADMIN_KEY, JSON.stringify(v));
  if (window.localStorage.getItem(ADMIN_KEY) !== JSON.stringify(v)) throw new Error("Nie udało się zapisać hasła.");
}

export async function verifyPassword(pw: string): Promise<boolean> {
  const v = readVerifier();
  if (!v) return false;
  const got = await derive(pw, fromB64(v.salt), v.iterations);
  const want = fromB64(v.hash);
  if (got.length !== want.length) return false;
  let diff = 0;
  for (let i = 0; i < got.length; i++) diff |= got[i] ^ want[i];
  return diff === 0;
}

export type GameKey = keyof typeof STORAGE_KEYS;

/** Removes only the selected ranking keys. Throws if removal did not take effect. */
export function resetRankings(games: GameKey[]) {
  for (const g of games) {
    window.localStorage.removeItem(STORAGE_KEYS[g]);
    if (window.localStorage.getItem(STORAGE_KEYS[g]) !== null) throw new Error("Nie udało się usunąć wyników.");
  }
  window.dispatchEvent(new Event(SCORES_CHANGED_EVENT));
}
