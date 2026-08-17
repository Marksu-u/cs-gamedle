"use client";

// Bridge between the pure layer and React. Server rendering must never touch
// `localStorage`: `getServerSnapshot` returns a neutral, frozen state, and the
// real one appears only after hydration. Hence the dash rather than a misleading
// zero while `hydrated` is false (see the display components).

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

// The server snapshot MUST be a stable reference: returning a new one on every
// call would make `useSyncExternalStore` loop forever.
const SERVER_SNAPSHOT: Persisted = EMPTY_PERSISTED;

function emettre(suivant: Persisted) {
  snapshot = suivant;
  save(suivant);
  for (const l of listeners) l();
}

// Base for a write: the state RE-READ from storage, not the in-memory snapshot.
//
// Storage is shared by every tab, and a write rewrites the whole document.
// Starting from the in-memory snapshot meant a tab opened before another
// finished a puzzle would erase that result — points included — and the puzzle
// became scorable again. With nine puzzles a day, playing across tabs is normal,
// not exotic.
//
// Re-reading before each write turns this into read-modify-write: the only
// remaining losing case is two writes within the same millisecond.
function base(): Persisted {
  return reconcile(load(), dayIndex());
}

// Another tab wrote: realign this one with storage.
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

  // First read: load from storage and align with the current day.
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

  // Records a terminal result.
  //
  // `drawnDay` is the day the puzzle was DRAWN under; the current day is re-read
  // here, at write time. That gap is what makes the "rollover mid-game" guard
  // exist at all: if the caller supplied the current day too, it would pass the
  // same value on both sides and the guard would be stillborn.
  commit(drawnDay: number, id: PuzzleId, result: PuzzleProgress) {
    emettre(commitPuzzle(base(), dayIndex(), id, result, drawnDay));
  },

  // Saves the progress of an in-flight puzzle, without touching the scores.
  // Same reasoning as `commit` for `drawnDay`.
  saveProgress(drawnDay: number, id: PuzzleId, gameState: unknown) {
    emettre(saveProgress(base(), dayIndex(), id, gameState, drawnDay));
  },

  // Test-only.
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

// `false` during server rendering and the first client render: components use it
// to show a dash instead of a wrong score.
export function useHydrated(): boolean {
  return useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
}
