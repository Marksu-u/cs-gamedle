// The streak and score state machine. Two PURE functions: no clock reads, no
// storage access. The current day is always passed in, which makes every
// transition directly testable.

import { streakMultiplier } from "./scoring";
import type { Persisted, Progress, PuzzleId, PuzzleProgress } from "./types";

// Called on load: aligns the persisted state with the current day.
//
// - last played day === today      → nothing to do
// - last played day === yesterday  → streak intact, today not played yet
// - anything older                 → a day was missed: streak and run score to zero
//
// The record has no business here: `commitPuzzle` maintains it eagerly, so it
// is already at its maximum by the time we get here.
export function reconcile(state: Persisted, today: number): Persisted {
  const progress = state.progress?.day === today ? state.progress : null;
  const { lastPlayedDay } = state.meta;

  // `lastPlayedDay > today` cannot happen with a monotonic UTC clock, but does
  // if the player winds their machine's clock back. Treat it as a break:
  // otherwise a streak would stay attached to a score it can no longer justify.
  const neverPlayed = lastPlayedDay < 0;
  const streakBroken =
    !neverPlayed && (lastPlayedDay < today - 1 || lastPlayedDay > today);
  const meta = streakBroken
    ? { ...state.meta, streak: 0, runScore: 0 }
    : state.meta;

  return { ...state, meta, progress };
}

// Called when a puzzle reaches a terminal status (won OR lost).
//
// `drawnDay` is the day the puzzle was drawn under: if it no longer matches
// today, the rollover happened mid-game and the result is discarded (otherwise
// yesterday's game would credit today).
export function commitPuzzle(
  state: Persisted,
  today: number,
  id: PuzzleId,
  result: PuzzleProgress,
  drawnDay: number = today,
): Persisted {
  // Discard THIS result, not the day: `reconcile` only drops progress that
  // genuinely belongs to a past day. Returning `progress: null` unconditionally
  // would erase puzzles legitimately finished today — which would then become
  // scorable a second time.
  if (drawnDay !== today) return reconcile(state, today);

  const base = reconcile(state, today);
  const progress: Progress = base.progress ?? { day: today, puzzles: {} };

  // A puzzle already finished today does not score twice.
  const alreadyFinished =
    progress.puzzles[id]?.status !== undefined &&
    progress.puzzles[id]?.status !== "playing";
  if (alreadyFinished) return base;

  // The streak updates on the FIRST result of the day, before the multiplier is
  // read: day one of a streak therefore scores at ×1.
  const firstOfTheDay = base.meta.lastPlayedDay !== today;
  const streak = firstOfTheDay
    ? base.meta.lastPlayedDay === today - 1
      ? base.meta.streak + 1
      : 1
    : base.meta.streak;

  const runScore =
    base.meta.runScore + Math.round(result.points * streakMultiplier(streak));

  return {
    ...base,
    meta: {
      streak,
      lastPlayedDay: today,
      runScore,
      recordScore: Math.max(base.meta.recordScore, runScore),
    },
    progress: { day: today, puzzles: { ...progress.puzzles, [id]: result } },
  };
}

// Saves the progress of an UNFINISHED puzzle (resume after a refresh).
// Touches neither the streak nor the scores.
//
// `drawnDay` plays the same role as in `commitPuzzle`, for the same reason: a
// tab opened before the rollover keeps saving after it. Without this guard,
// yesterday's game state would be rewritten under today's date, and tomorrow's
// puzzle would resume with yesterday's guesses — evaluated against a different
// answer.
export function saveProgress(
  state: Persisted,
  today: number,
  id: PuzzleId,
  gameState: unknown,
  drawnDay: number = today,
): Persisted {
  if (drawnDay !== today) return reconcile(state, today);

  const base = reconcile(state, today);
  const progress: Progress = base.progress ?? { day: today, puzzles: {} };
  if (
    progress.puzzles[id]?.status !== undefined &&
    progress.puzzles[id]?.status !== "playing"
  ) {
    return base; // already finished: do not overwrite
  }
  return {
    ...base,
    progress: {
      day: today,
      puzzles: {
        ...progress.puzzles,
        [id]: { status: "playing", points: 0, state: gameState },
      },
    },
  };
}
