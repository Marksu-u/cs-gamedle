import { describe, expect, it } from "vitest";
import {
  guessrPoints,
  molPoints,
  streakMultiplier,
  wordlePoints,
} from "./scoring";

describe("wordlePoints", () => {
  it.each([
    // longueur, essai, indices, attendu
    [8, 1, 0, 170],
    [5, 1, 0, 134],
    [3, 1, 0, 110],
    [5, 3, 1, 97],
    [3, 6, 2, 43],
  ])(
    "L%i, essai %i, %i indice(s) → %i pts",
    (len, attempt, hints, expected) => {
      expect(wordlePoints({ length: len, attempt, hints, won: true })).toBe(
        expected,
      );
    },
  );

  it("returns 0 when the puzzle is lost", () => {
    expect(wordlePoints({ length: 8, attempt: 1, hints: 0, won: false })).toBe(
      0,
    );
  });

  it("rewards longer words at equal performance", () => {
    const court = wordlePoints({ length: 3, attempt: 2, hints: 0, won: true });
    const long = wordlePoints({ length: 8, attempt: 2, hints: 0, won: true });
    expect(long).toBeGreaterThan(court);
  });

  it("penalises each hint", () => {
    const sans = wordlePoints({ length: 5, attempt: 2, hints: 0, won: true });
    const avec = wordlePoints({ length: 5, attempt: 2, hints: 1, won: true });
    expect(avec).toBeLessThan(sans);
  });
});

describe("guessrPoints", () => {
  it.each([
    [1, 0, 200],
    [5, 2, 77],
    [15, 4, 40],
  ])("%i essai(s), %i indice(s) → %i pts", (guesses, hints, expected) => {
    expect(guessrPoints({ guesses, hints, won: true })).toBe(expected);
  });

  it("never drops below the floor of 40", () => {
    expect(guessrPoints({ guesses: 200, hints: 4, won: true })).toBe(40);
  });

  it("returns 0 on giving up", () => {
    expect(guessrPoints({ guesses: 3, hints: 0, won: false })).toBe(0);
  });
});

describe("molPoints", () => {
  it("returns 14 points per correct answer", () => {
    expect(molPoints(0)).toBe(0);
    expect(molPoints(1)).toBe(14);
    expect(molPoints(7)).toBe(98);
  });

  it("adds a 40-point bonus for a perfect run", () => {
    expect(molPoints(10)).toBe(180);
  });

  it("does not grant the bonus at 9 correct answers", () => {
    expect(molPoints(9)).toBe(126);
  });
});

describe("streakMultiplier", () => {
  it.each([
    [0, 1],
    [1, 1],
    [2, 1],
    [3, 1.25],
    [6, 1.25],
    [7, 1.5],
    [13, 1.5],
    [14, 1.75],
    [29, 1.75],
    [30, 2],
    [59, 2],
    [60, 2.5],
    [365, 2.5],
  ])("streak of %i days → ×%s", (streak, expected) => {
    expect(streakMultiplier(streak)).toBe(expected);
  });

  it("never decreases as the streak grows", () => {
    for (let s = 1; s < 200; s++) {
      expect(streakMultiplier(s)).toBeGreaterThanOrEqual(
        streakMultiplier(s - 1),
      );
    }
  });
});

describe("overall balance", () => {
  it("is 1400 — 840 Wordle + 200 Guessr + 360 More or Lessr", () => {
    const wordle = [3, 4, 5, 6, 7, 8].reduce(
      (t, len) =>
        t + wordlePoints({ length: len, attempt: 1, hints: 0, won: true }),
      0,
    );
    expect(wordle).toBe(840);
    expect(guessrPoints({ guesses: 1, hints: 0, won: true })).toBe(200);
    expect(molPoints(10) * 2).toBe(360);
    // 840 + 200 + 360: the total of a perfect day. It exists only as an
    // assertion — no screen displays it, so there is no constant.
    expect(
      wordle +
        guessrPoints({ guesses: 1, hints: 0, won: true }) +
        molPoints(10) * 2,
    ).toBe(1400);
  });
});
