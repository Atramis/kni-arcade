import { beforeEach, describe, expect, it } from "vitest";
import { ADMIN_KEY, resetRankings, setPassword, validateNewPassword, verifyPassword } from "@/lib/admin-auth";
import { STORAGE_KEYS } from "@/lib/local-scores";

describe("admin lock", () => {
  beforeEach(() => window.localStorage.clear());

  it("rejects passwords shorter than 8 chars", () => {
    expect(validateNewPassword("1234567", "1234567")).not.toBeNull();
  });
  it("rejects mismatched repeat", () => {
    expect(validateNewPassword("abcdefgh", "abcdefgX")).not.toBeNull();
  });
  it("stores only a verifier and checks the password", async () => {
    await setPassword("tajne-haslo");
    expect(window.localStorage.getItem(ADMIN_KEY)).not.toContain("tajne-haslo");
    expect(await verifyPassword("tajne-haslo")).toBe(true);
    expect(await verifyPassword("zle-haslo")).toBe(false);
  });
  it("resetting one game keeps the other game and the password", async () => {
    await setPassword("tajne-haslo");
    window.localStorage.setItem(STORAGE_KEYS.memoryLeak, "[1]");
    window.localStorage.setItem(STORAGE_KEYS.packetRouter, "[2]");
    resetRankings(["memoryLeak"]);
    expect(window.localStorage.getItem(STORAGE_KEYS.memoryLeak)).toBeNull();
    expect(window.localStorage.getItem(STORAGE_KEYS.packetRouter)).toBe("[2]");
    resetRankings(["memoryLeak", "packetRouter"]);
    expect(window.localStorage.getItem(STORAGE_KEYS.packetRouter)).toBeNull();
    expect(window.localStorage.getItem(ADMIN_KEY)).not.toBeNull();
  });
});
