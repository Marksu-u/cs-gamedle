"use client";

// Pont entre la couche pure et React. Le rendu serveur ne doit jamais toucher
// `localStorage` : `getServerSnapshot` rend un état neutre, figé, et l'état réel
// n'apparaît qu'après hydratation. D'où l'affichage d'un tiret plutôt que d'un
// zéro trompeur tant que `hydrated` est faux (cf. composants d'affichage).

import { useSyncExternalStore } from "react";
import { dayIndex, msUntilNextRotation } from "./clock";
import { commitPuzzle, reconcile, saveProgress } from "./reconcile";
import { load, save } from "./storage";
import {
  EMPTY_PERSISTED,
  type Persisted,
  type PuzzleId,
  type PuzzleProgress,
} from "./types";

type Listener = () => void;

let snapshot: Persisted = EMPTY_PERSISTED;
let charge = false;
const listeners = new Set<Listener>();

// Le snapshot serveur DOIT être une référence stable : en rendre une nouvelle à
// chaque appel ferait boucler `useSyncExternalStore`.
const SERVER_SNAPSHOT: Persisted = EMPTY_PERSISTED;

function emettre(suivant: Persisted) {
  snapshot = suivant;
  save(suivant);
  for (const l of listeners) l();
}

export const dailyStore = {
  subscribe(listener: Listener) {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  },

  // Première lecture : on charge depuis le stockage et on aligne sur le jour courant.
  getSnapshot(): Persisted {
    if (!charge) {
      charge = true;
      snapshot = reconcile(load(), dayIndex());
    }
    return snapshot;
  },

  getServerSnapshot(): Persisted {
    return SERVER_SNAPSHOT;
  },

  // Enregistre un résultat terminal.
  //
  // `drawnDay` est le jour sous lequel la grille a été TIRÉE ; le jour courant
  // est relu ici, au moment de l'écriture. C'est ce décalage qui fait exister le
  // garde-fou « bascule pendant la partie » : si l'appelant fournissait aussi le
  // jour courant, il passerait la même valeur des deux côtés et le garde-fou
  // serait mort-né.
  commit(drawnDay: number, id: PuzzleId, result: PuzzleProgress) {
    emettre(commitPuzzle(this.getSnapshot(), dayIndex(), id, result, drawnDay));
  },

  // Sauvegarde l'avancement d'une grille en cours, sans toucher aux scores.
  // Même raisonnement que `commit` pour `drawnDay`.
  saveProgress(drawnDay: number, id: PuzzleId, gameState: unknown) {
    emettre(
      saveProgress(this.getSnapshot(), dayIndex(), id, gameState, drawnDay),
    );
  },

  // Réservé aux tests.
  reset() {
    charge = false;
    snapshot = EMPTY_PERSISTED;
    listeners.clear();
  },
};

export function useDailyState(): Persisted {
  return useSyncExternalStore(
    dailyStore.subscribe,
    () => dailyStore.getSnapshot(),
    () => dailyStore.getServerSnapshot(),
  );
}

// `false` pendant le rendu serveur et le premier rendu client : les composants
// s'en servent pour afficher un tiret au lieu d'un score faux.
export function useHydrated(): boolean {
  return useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
}

export { dayIndex, msUntilNextRotation };
