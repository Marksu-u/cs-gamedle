// Shared Wordle types. Deliberately generic (not CS2-specific) so they stay
// reusable for another universe.

// State of a tile after evaluation. "empty" = not played yet.
export type TileState = "correct" | "present" | "absent" | "empty";

// State of a keyboard key (aggregated over every guess). "unused" = never typed.
export type KeyState = "correct" | "present" | "absent" | "unused";

export type GameStatus = "playing" | "won" | "lost";

// Shape of the data JSON (app/data/<game>/wordle.json).
export type WordleData = { game: string; words: Record<string, string[]> };

// State of one board (one board per word length).
export type BoardState = {
  target: string;
  length: number;
  guesses: string[]; // submitted guesses
  evaluations: TileState[][]; // colouring per guess (same index as guesses)
  current: string; // current input (not submitted)
  status: GameStatus;
  invalid: boolean; // transient flag: triggers the shake then resets to false
  hintedChars: string[]; // characters revealed by a hint (shown "present" on the keyboard)
  mode: "daily" | "practice"; // practice scores nothing
  day: number; // day the target was drawn under
};

// Global state: every board plus the active tab.
export type WordleState = {
  activeLength: number;
  boards: Record<number, BoardState>;
};

// 6 essais comme le Wordle classique (cf. data/modes.ts).
export const MAX_ATTEMPTS = 6;

// Plafond d'indices par grille. Sans plafond, la grille du jour serait triviale.
export const MAX_HINTS = 3;
