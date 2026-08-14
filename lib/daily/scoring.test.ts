import { describe, expect, it } from "vitest";
import {
  DAILY_MAX,
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

  it("rend 0 si la grille est perdue", () => {
    expect(wordlePoints({ length: 8, attempt: 1, hints: 0, won: false })).toBe(
      0,
    );
  });

  it("récompense les mots longs à performance égale", () => {
    const court = wordlePoints({ length: 3, attempt: 2, hints: 0, won: true });
    const long = wordlePoints({ length: 8, attempt: 2, hints: 0, won: true });
    expect(long).toBeGreaterThan(court);
  });

  it("pénalise chaque indice", () => {
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

  it("ne descend jamais sous le plancher de 40", () => {
    expect(guessrPoints({ guesses: 200, hints: 4, won: true })).toBe(40);
  });

  it("rend 0 en cas d'abandon", () => {
    expect(guessrPoints({ guesses: 3, hints: 0, won: false })).toBe(0);
  });
});

describe("molPoints", () => {
  it("rend 14 points par bonne réponse", () => {
    expect(molPoints(0)).toBe(0);
    expect(molPoints(1)).toBe(14);
    expect(molPoints(7)).toBe(98);
  });

  it("ajoute 40 de bonus pour un sans-faute", () => {
    expect(molPoints(10)).toBe(180);
  });

  it("ne donne pas le bonus à 9 bonnes réponses", () => {
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
  ])("série de %i jours → ×%s", (streak, expected) => {
    expect(streakMultiplier(streak)).toBe(expected);
  });

  it("ne décroît jamais quand la série grandit", () => {
    for (let s = 1; s < 200; s++) {
      expect(streakMultiplier(s)).toBeGreaterThanOrEqual(
        streakMultiplier(s - 1),
      );
    }
  });
});

describe("DAILY_MAX", () => {
  it("vaut 1400 — 840 Wordle + 200 Guessr + 360 More or Lessr", () => {
    const wordle = [3, 4, 5, 6, 7, 8].reduce(
      (t, len) =>
        t + wordlePoints({ length: len, attempt: 1, hints: 0, won: true }),
      0,
    );
    expect(wordle).toBe(840);
    expect(guessrPoints({ guesses: 1, hints: 0, won: true })).toBe(200);
    expect(molPoints(10) * 2).toBe(360);
    expect(DAILY_MAX).toBe(1400);
  });
});
