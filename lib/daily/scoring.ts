// Barème des points. Toutes les fonctions sont pures : elles ne lisent ni l'heure,
// ni le stockage, ni l'état d'un reducer. Elles sont appelées au moment où une
// grille atteint un statut terminal.
//
// Principe commun aux trois jeux : on part d'une base liée à la difficulté, puis
// on retranche ce que le joueur a consommé (essais, indices).

import { MAX_ATTEMPTS } from "@/lib/wordle/types";

// ---------------------------------------------------------------- Wordle

// Base croissante avec la longueur du mot : un 8 lettres vaut plus qu'un 3 lettres.
function wordleBase(length: number): number {
  return 60 + (length - 3) * 12;
}

export type WordleOutcome = {
  length: number;
  attempt: number; // numéro de l'essai gagnant, 1..MAX_ATTEMPTS
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

// Essais illimités : décroissance continue plutôt que couperet, avec un plancher
// pour qu'une partie longue rapporte tout de même quelque chose.
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

// Paliers : lisibles, avec des objectifs visibles. La série prise en compte
// INCLUT le jour en cours, donc le premier jour d'une série est à ×1.
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

// Total théorique d'une journée parfaite : sert à afficher une progression
// ("620 / 1400") et à cadrer l'équilibrage.
export const DAILY_MAX = 1400;
