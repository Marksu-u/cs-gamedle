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
  guesses: string[]; // essais soumis
  evaluations: TileState[][]; // coloriage par essai (même index que guesses)
  current: string; // saisie en cours (non soumise)
  status: GameStatus;
  invalid: boolean; // flag transitoire : déclenche le shake puis est remis à false
  hintedChars: string[]; // caractères révélés via indice (affichés "present" au clavier)
  mode: "daily" | "practice"; // l'entraînement ne rapporte aucun point
  day: number; // jour sous lequel la cible a été tirée
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
