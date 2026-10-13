import { describe, expect, it } from "vitest";
import { cellsForLevel, compareScores, randomPattern, validateNick, withPlaces } from "./engine";

describe("memory leak rules", () => {
  it("level 1 has 3 cells and level 10 has 12", () => {
    expect(cellsForLevel(1)).toBe(3);
    expect(cellsForLevel(10)).toBe(12);
  });

  it("pattern has distinct cells within 5x5", () => {
    const p = randomPattern(12);
    expect(p.size).toBe(12);
    for (const c of p) expect(c >= 0 && c < 25).toBe(true);
  });

  it("ranks by level desc, then errors asc, then time asc", () => {
    expect(compareScores({ level: 5, errors: 2, time_ms: 50000 }, { level: 4, errors: 0, time_ms: 1000 })).toBeLessThan(0);
    expect(compareScores({ level: 5, errors: 0, time_ms: 50000 }, { level: 5, errors: 1, time_ms: 1000 })).toBeLessThan(0);
    expect(compareScores({ level: 5, errors: 1, time_ms: 1000 }, { level: 5, errors: 1, time_ms: 2000 })).toBeLessThan(0);
  });

  it("identical results share a place", () => {
    const r = withPlaces([
      { level: 3, errors: 1, time_ms: 9000 },
      { level: 3, errors: 1, time_ms: 9000 },
      { level: 2, errors: 0, time_ms: 5000 },
    ]);
    expect(r.map((x) => x.place)).toEqual([1, 1, 3]);
  });

  it("nick must be 2-20 chars after trim, Polish letters allowed", () => {
    expect(validateNick("  a ")).toBeNull();
    expect(validateNick("Żółć")).toBe("Żółć");
    expect(validateNick("x".repeat(21))).toBeNull();
  });
});
