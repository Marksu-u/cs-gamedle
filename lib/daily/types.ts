// Types for the daily layer, shared by all three games.

// Stable id for a daily puzzle. Doubles as the stream key for the draw AND the
// progress key in storage — the two must line up.
export type PuzzleId =
  | "wordle-3"
  | "wordle-4"
  | "wordle-5"
  | "wordle-6"
  | "wordle-7"
  | "wordle-8"
  | "guessr"
  | "mol-tournaments"
  | "mol-prize";

// A puzzle is either in progress or finished (won or lost). Giving up counts as
// finished: the day is played, the points are 0.
export type PuzzleStatus = "playing" | "won" | "lost";

// Progress of one daily puzzle. `state` is the serialised game state of the
// matching reducer — opaque here, each game knows how to read its own.
export type PuzzleProgress = {
  status: PuzzleStatus;
  points: number; // raw points, before the multiplier; 0 while status === "playing"
  state: unknown; // reducer state, so a refresh can resume
};

// What survives the rollover.
export type Meta = {
  streak: number;
  lastPlayedDay: number; // dayIndex of the last day with >= 1 finished puzzle; -1 if never played
  runScore: number; // current run, reset to zero when a day is missed
  recordScore: number; // best runScore ever reached, never reset
};

// What is discarded on every rollover.
export type Progress = {
  day: number;
  puzzles: Partial<Record<PuzzleId, PuzzleProgress>>;
};

// The complete shape written to localStorage.
export type Persisted = {
  version: 1;
  meta: Meta;
  progress: Progress | null;
};

export const STORAGE_KEY = "cs-gamedle:v1";
export const STORAGE_VERSION = 1;

export const EMPTY_META: Meta = {
  streak: 0,
  lastPlayedDay: -1,
  runScore: 0,
  recordScore: 0,
};

export const EMPTY_PERSISTED: Persisted = {
  version: STORAGE_VERSION,
  meta: EMPTY_META,
  progress: null,
};
