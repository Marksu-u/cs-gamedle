"use client";

// Plumbing shared by all three games: the current day, resume-after-refresh, and
// recording the result. The games never talk to storage directly — only to this
// hook.

import { useCallback, useEffect, useRef } from "react";
import { useState } from "react";
import { dayIndex } from "./clock";
import { dailyStore, useDailyState, useHydrated } from "./store";
import type { PuzzleId, PuzzleProgress } from "./types";

export function useDay(): number {
  // Frozen for the lifetime of the mount: a rollover mid-game is handled when the
  // result is committed (see commitPuzzle), not by a re-render. `useState`'s lazy
  // initialiser runs only on the first render, which freezes the value without a
  // ref — reading one during render is forbidden by the `react-hooks/refs` rule.
  const [day] = useState(() => dayIndex());
  return day;
}

type Options<S> = {
  id: PuzzleId;
  day: number; // jour du TIRAGE
  state: S; // current game state, the one being saved
  onRestore: (state: S) => void; // must be stable (useCallback)
  savable: boolean; // partie en cours ET quotidienne
};

// Resume and save for a daily puzzle, in ONE single effect.
//
// They belong in the same effect because their ORDER is the bug. On the first
// client render `useSyncExternalStore` still returns the SERVER snapshot — an
// empty store. Split into two effects, the resume therefore finds nothing to
// restore while the save runs in the same commit and writes the pristine board
// over the saved game: it is lost before the real store has even been read.
//
// This was not just lost progress: with the attempt counter back at zero, a
// simple refresh handed back full points on a half-played puzzle.
//
// Here the first pass for a given puzzle settles the resume and RETURNS without
// writing. The next pass — triggered by the state change the resume just caused
// — saves the restored state.
export function useDailyPuzzle<S>({
  id,
  day,
  state,
  onRestore,
  savable,
}: Options<S>) {
  const persisted = useDailyState();
  const hydrated = useHydrated();
  const entry =
    persisted.progress?.day === day
      ? persisted.progress.puzzles[id]
      : undefined;
  const saved = entry?.state as S | undefined;

  // `useCallback` is NOT cosmetic here. `save` and `commit` are effect
  // dependencies whose bodies write to the store; the store notifies, the
  // component re-renders. Without a stable identity the effect would re-fire on
  // every render and loop forever.
  const save = useCallback(
    (gameState: S) => dailyStore.saveProgress(day, id, gameState),
    [day, id],
  );
  // `day` is the DRAW day. The store re-reads the clock at write time: the gap
  // between the two is what makes the "rollover mid-game" guard exist.
  const commit = useCallback(
    (result: PuzzleProgress) => dailyStore.commit(day, id, result),
    [day, id],
  );

  // Last puzzle whose resume has been settled. A ref, not state: it is only read
  // inside the effect, and changing it must not trigger a render.
  const repriseTranchee = useRef<PuzzleId | null>(null);

  useEffect(() => {
    if (!hydrated) return;

    if (repriseTranchee.current !== id) {
      repriseTranchee.current = id;
      if (saved !== undefined) {
        onRestore(saved);
        return; // never save before the resume has landed
      }
    }

    if (savable) save(state);
  }, [hydrated, id, saved, onRestore, savable, state, save]);

  return {
    // Is today's puzzle already finished?
    done: entry !== undefined && entry.status !== "playing",
    points: entry?.points ?? 0,
    commit,
  };
}
