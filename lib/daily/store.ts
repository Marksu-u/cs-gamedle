"use client";

// Pont entre la couche pure et React. Le rendu serveur ne doit jamais toucher
// `localStorage` : `getServerSnapshot` rend un état neutre, figé, et l'état réel
// n'apparaît qu'après hydratation. D'où l'affichage d'un tiret plutôt que d'un
// zéro trompeur tant que `hydrated` est faux (cf. composants d'affichage).

import { useSyncExternalStore } from "react";
import { dayIndex } from "./clock";
import { commitPuzzle, reconcile, saveProgress } from "./reconcile";
import { load, save } from "./storage";
import {
  EMPTY_PERSISTED,
  STORAGE_KEY,
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

// Base d'une écriture : l'état RELU dans le stockage, pas l'instantané en
// mémoire.
//
// Le stockage est partagé entre tous les onglets, et une écriture réécrit le
// document entier. En partant de l'instantané en mémoire, un onglet ouvert avant
// qu'un autre ne termine une grille écrasait ce résultat — points compris — et
// la grille redevenait marquable. Neuf grilles par jour rendent le multi-onglets
// banal, pas exotique.
//
// Relire avant chaque écriture transforme cela en lecture-modification-écriture :
// le seul cas encore perdant est deux écritures dans la même milliseconde.
function base(): Persisted {
  return reconcile(load(), dayIndex());
}

// Un autre onglet a écrit : on réaligne cet onglet-ci sur le stockage.
function surStorage(e: StorageEvent) {
  if (e.key !== null && e.key !== STORAGE_KEY) return;
  snapshot = base();
  for (const l of listeners) l();
}

export const dailyStore = {
  subscribe(listener: Listener) {
    if (listeners.size === 0 && typeof window !== "undefined") {
      window.addEventListener("storage", surStorage);
    }
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
      if (listeners.size === 0 && typeof window !== "undefined") {
        window.removeEventListener("storage", surStorage);
      }
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
    emettre(commitPuzzle(base(), dayIndex(), id, result, drawnDay));
  },

  // Sauvegarde l'avancement d'une grille en cours, sans toucher aux scores.
  // Même raisonnement que `commit` pour `drawnDay`.
  saveProgress(drawnDay: number, id: PuzzleId, gameState: unknown) {
    emettre(saveProgress(base(), dayIndex(), id, gameState, drawnDay));
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
