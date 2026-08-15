// Shared types for the More or Lessr game. Generic (not CS2-specific) so they
// stay reusable for another universe.

// A comparable pro. `peak_year` is indicative (displayed), never compared.
export type Player = {
  name: string;
  team: string;
  nationality: string; // country name → flag in the UI
  peak_rating: number; // meilleur rating annuel HLTV, ex. 1.35
  peak_year?: number;
  prize_money: number; // career $ (integer)
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
  anchor: Player | null; // revealed card: the reference value (known)
  challenger: Player | null; // hidden card: more or less than the anchor?
  round: number; // 1..TOTAL_ROUNDS
  score: number;
  lastGuess: Direction | null; // direction played (feedback during "revealed")
  lastCorrect: boolean | null; // feedback juste/faux pendant « revealed »
  status: Status;
  mode: "daily" | "practice"; // practice scores nothing
  day: number; // day the sequence was drawn under
};

// 10 rounds → 11 players consumed per run.
export const TOTAL_ROUNDS = 10;
