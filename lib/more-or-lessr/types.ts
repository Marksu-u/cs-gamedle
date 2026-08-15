// Shared types for the More or Lessr game. Generic (not CS2-specific) so they
// stay reusable for another universe.

// A comparable pro. `peak_year` is indicative (displayed), never compared.
export type Player = {
  name: string;
  team: string;
  nationality: string; // nom de pays → drapeau côté UI
  peak_rating: number; // meilleur rating annuel HLTV, ex. 1.35
  peak_year?: number;
  prize_money: number; // $ carrière (entier)
};

// Forme du JSON (app/data/cs2/more-or-lessr.json).
export type MorelessData = { game: string; players: Player[] };

// Les deux stats comparables.
export type Category = "rating" | "prize";

// Direction of the answer: does the challenger have "more" or "less" than the anchor?
export type Direction = "more" | "less";

// Current screen: selection → play → round reveal → end.
export type Status = "select" | "playing" | "revealed" | "finished";

export type GameState = {
  category: Category | null;
  sequence: Player[]; // joueurs du jour (TOTAL_ROUNDS + 1)
  nextIndex: number; // index du prochain challenger dans `sequence`
  anchor: Player | null; // carte révélée : la valeur de référence (connue)
  challenger: Player | null; // carte cachée : plus ou moins que l'ancre ?
  round: number; // 1..TOTAL_ROUNDS
  score: number;
  lastGuess: Direction | null; // direction jouée (feedback pendant « revealed »)
  lastCorrect: boolean | null; // feedback juste/faux pendant « revealed »
  status: Status;
  mode: "daily" | "practice"; // l'entraînement ne rapporte aucun point
  day: number; // jour sous lequel la séquence a été tirée
};

// 10 rounds → 11 players consumed per run.
export const TOTAL_ROUNDS = 10;
