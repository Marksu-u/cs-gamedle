// Types partagés du jeu « Guessr ». Génériques (indépendants de CS2) pour
// rester réutilisables sur un autre univers.

// Un joueur du pool. `achievements` est du texte d'affichage (révélation), jamais comparé.
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

// Résultat de couleur d'une cellule.
export type Match = "exact" | "partial" | "miss";

// Sens d'une comparaison numérique : la cible est-elle au-dessus / en-dessous / égale au guess ?
export type Direction = "up" | "down" | "equal";

// Résultat d'une colonne, discriminé par `kind` pour le rendu.
export type FieldResult =
  | { kind: "text"; match: Match; value: string }
  | { kind: "set"; match: Match; value: string[] }
  | { kind: "number"; match: Match; value: number; direction: Direction };

// Résultat complet d'une proposition (les 8 colonnes).
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

// Ligne de la grille : un guess complet, ou un indice (une seule colonne révélée).
export type GridRow =
  | { kind: "guess"; result: GuessResult }
  | { kind: "hint"; field: HintField; result: FieldResult };

// Écran courant : on joue, on a gagné, ou on a abandonné. Essais illimités → pas de défaite « naturelle ».
export type Status = "playing" | "won" | "gaveup";

export type GameState = {
  target: Player; // joueur du jour (caché)
  rows: GridRow[]; // plus récent en tête (guesses ET indices)
  status: Status;
};
