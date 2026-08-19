// Shared Wordle types. Deliberately generic (not CS2-specific) so they stay
// reusable for another universe.

// State of a tile after evaluation. "empty" = not played yet.
export type TileState = "correct" | "present" | "absent" | "empty";

// State of a keyboard key (aggregated over every guess). "unused" = never typed.
export type KeyState = "correct" | "present" | "absent" | "unused";

export type GameStatus = "playing" | "won" | "lost";

// Shape of the data JSON (app/data/<game>/wordle.json).
export type WordleData = { game: string; words: Record<string, string[]> };

// State of one board (one board per slot).
export type BoardState = {
  target: string;
  slot: number; // 0..SLOT_COUNT-1 — the board's identity
  length: number; // target.length, kept for tile sizing and scoring
  guesses: string[]; // submitted guesses
  evaluations: TileState[][]; // colouring per guess (same index as guesses)
  current: string; // current input (not submitted)
  status: GameStatus;
  invalid: boolean; // transient flag: triggers the shake then resets to false
  hintedChars: string[]; // characters revealed by a hint (shown "present" on the keyboard)
  mode: "daily" | "practice"; // practice scores nothing
  day: number; // day the target was drawn under
};

// Global state. `boards` is an ARRAY indexed by slot, not a map keyed by word
// length: the day's five tags are drawn independently and two of them are
// routinely the same length, which under the old shape collided on the key and
// let one board silently overwrite the other.
export type WordleState = {
  activeSlot: number;
  boards: BoardState[]; // SLOT_COUNT entries, index === slot
};

// 6 essais comme le Wordle classique (cf. data/modes.ts).
export const MAX_ATTEMPTS = 6;

// Plafond d'indices par grille. Sans plafond, la grille du jour serait triviale.
export const MAX_HINTS = 3;

// Boards per day, one per slot. The five tags are unrelated pros drawn at
// random: there is no team to deduce, each slot is its own small puzzle.
export const SLOT_COUNT = 5;
