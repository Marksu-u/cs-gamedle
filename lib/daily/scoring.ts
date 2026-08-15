// The points table. Every function here is pure: none reads the clock, storage,
// or a reducer's state. They are called when a puzzle reaches a terminal status.
//
// The principle is the same across all three games: start from a difficulty-based
// figure, then subtract what the player spent (tries, hints).

import { MAX_ATTEMPTS } from "@/lib/wordle/types";

// ---------------------------------------------------------------- Wordle

// Base grows with tag length: an 8-letter answer is worth more than a 3-letter one.
function wordleBase(length: number): number {
  return 60 + (length - 3) * 12;
}

export type WordleOutcome = {
  length: number;
  attempt: number; // index of the winning try, 1..MAX_ATTEMPTS
  hints: number;
  won: boolean;
};

export function wordlePoints({
  length,
  attempt,
  hints,
  won,
}: WordleOutcome): number {
  if (!won) return 0;
  const brut = wordleBase(length) + (MAX_ATTEMPTS - attempt) * 10;
  return Math.round(brut * Math.pow(0.85, hints));
}

// ---------------------------------------------------------------- Guessr

// Unlimited tries, so a continuous decay rather than a cliff, with a floor so a
// long game still pays something.
const GUESSR_BASE = 200;
const GUESSR_FLOOR = 40;

export type GuessrOutcome = {
  guesses: number; // nombre de propositions, >= 1
  hints: number;
  won: boolean;
};

export function guessrPoints({ guesses, hints, won }: GuessrOutcome): number {
  if (!won) return 0;
  const brut = GUESSR_BASE * Math.pow(0.88, guesses - 1) * Math.pow(0.8, hints);
  return Math.max(Math.round(brut), GUESSR_FLOOR);
}

// ---------------------------------------------------------- More or Lessr

const MOL_PER_ROUND = 14;
const MOL_PERFECT_BONUS = 40;
const MOL_TOTAL_ROUNDS = 10;

export function molPoints(correct: number): number {
  const base = correct * MOL_PER_ROUND;
  return correct === MOL_TOTAL_ROUNDS ? base + MOL_PERFECT_BONUS : base;
}

// ---------------------------------------------------------- Multiplicateur

// Tiers: readable, with visible milestones. The streak used INCLUDES the current
// day, so day one of a streak scores at ×1.
const TIERS: [seuil: number, mult: number][] = [
  [60, 2.5],
  [30, 2],
  [14, 1.75],
  [7, 1.5],
  [3, 1.25],
];

export function streakMultiplier(streak: number): number {
  for (const [seuil, mult] of TIERS) {
    if (streak >= seuil) return mult;
  }
  return 1;
}
