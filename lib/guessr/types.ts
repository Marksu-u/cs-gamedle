// Shared types for the Guessr game. Deliberately generic (not CS2-specific) so
// they stay reusable for another universe.

// A player from the pool. `achievements` is display text (on reveal), never compared.
export type Player = {
  name: string;
  nationality: string; // nom de pays → drapeau (lib/more-or-lessr/flags)
  current_team: string;
  previous_teams: string[]; // ensemble, comparaison partielle
  role: string[]; // rôles normalisés, comparaison partielle
  age: number;
  majors: number; // nb de Majors gagnés
  tournaments_won: number; // nb de tournois S-tier gagnés
  achievements: string[]; // texte affiché à la victoire
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
  correct: boolean; // le nom correspond à la cible
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
  target: Player; // joueur du jour (caché)
  rows: GridRow[]; // plus récent en tête (guesses ET indices)
  status: Status;
  mode: "daily" | "practice"; // l'entraînement ne rapporte aucun point
  day: number; // jour sous lequel la cible a été tirée
};
