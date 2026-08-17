// Shared types for the Guessr game. Deliberately generic (not CS2-specific) so
// they stay reusable for another universe.

// A player from the pool. `achievements` is display text (on reveal), never compared.
export type Player = {
  name: string;
  nationality: string; // nom de pays → drapeau (lib/more-or-lessr/flags)
  current_team: string;
  previous_teams: string[]; // ensemble, comparaison partielle
  role: string[]; // normalised roles, partial comparison
  age: number;
  majors: number; // number of Majors won
  tournaments_won: number; // number of S-tier tournaments won
  achievements: string[]; // text shown on victory
};

// Forme du JSON (app/data/cs2/guessr_players.json).
export type GuessrData = { game: string; players: Player[] };

// Colour outcome of a cell.
export type Match = "exact" | "partial" | "miss";

// Direction of a numeric comparison: is the target above / below / equal to the guess?
export type Direction = "up" | "down" | "equal";

// Result for one column, discriminated by `kind` for rendering.
export type FieldResult =
  | { kind: "text"; match: Match; value: string }
  | { kind: "set"; match: Match; value: string[] }
  | { kind: "number"; match: Match; value: number; direction: Direction };

// Complete result for one guess (all 8 columns).
export type GuessResult = {
  player: Player;
  correct: boolean; // the name matches the target
  nationality: FieldResult;
  current_team: FieldResult;
  previous_teams: FieldResult;
  role: FieldResult;
  age: FieldResult;
  majors: FieldResult;
  tournaments_won: FieldResult;
};

// Colonnes pouvant faire l'objet d'un indice (toutes sauf le nom).
export type HintField =
  | "nationality"
  | "current_team"
  | "previous_teams"
  | "role"
  | "age"
  | "majors"
  | "tournaments_won";

// A grid row: a full guess, or a hint (a single revealed column).
export type GridRow =
  | { kind: "guess"; result: GuessResult }
  | { kind: "hint"; field: HintField; result: FieldResult };

// Current screen: playing, won, or gave up. Unlimited tries → no "natural" loss.
export type Status = "playing" | "won" | "gaveup";

export type GameState = {
  target: Player; // player of the day (hidden)
  rows: GridRow[]; // newest first (both guesses AND hints)
  status: Status;
  mode: "daily" | "practice"; // practice scores nothing
  day: number; // day the target was drawn under
};
