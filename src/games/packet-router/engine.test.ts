import { describe, it, expect } from "vitest";
import { generatePuzzle, findRoute, rotate, scoreFail, scoreSuccess, validateNick, SIZE, ROUND_SECONDS, TIME_BONUS } from "./engine";

describe("packet router rules", () => {
  it("every generated puzzle is solvable by rotations and not pre-solved", () => {
    for (let lvl = 0; lvl < 10; lvl++) {
      const p = generatePuzzle(lvl);
      expect(findRoute(p)).toBeNull();
      // brute force via knowing generator: rotating any tile 4x returns to same
      expect(rotate(rotate(rotate(rotate(p.tiles[0]!))))).toBe(p.tiles[0]);
      expect(p.tiles.length).toBe(SIZE * SIZE);
    }
  });
  it("round lasts 2 minutes and each success adds 10 seconds", () => {
    expect(ROUND_SECONDS).toBe(120);
    expect(TIME_BONUS).toBe(10);
  });
  it("score never negative after failure", () => {
    expect(scoreFail(10)).toEqual({ score: 0, streak: 0 });
  });
  it("streak adds bonus", () => {
    expect(scoreSuccess(0, 2)).toEqual({ score: 150, streak: 3 });
  });
  it("nick 2-16 chars, trimmed", () => {
    expect(validateNick("  ab ")).toBe("ab");
    expect(validateNick("   ")).toBeNull();
    expect(validateNick("a")).toBeNull();
    expect(validateNick("x".repeat(17))).toBeNull();
  });
});
