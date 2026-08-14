// Types partagés du jeu « More or Lessr ». Génériques (indépendants de CS2) pour
// rester réutilisables sur un autre univers.

// Un pro comparable. `peak_year` est indicatif (affiché), jamais comparé.
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

// Sens de la réponse : le challenger a-t-il « plus » ou « moins » que l'ancre ?
export type Direction = "more" | "less";

// Écran courant : sélection → jeu → révélation du round → fin.
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
};

// 10 rounds → 11 joueurs consommés par partie.
export const TOTAL_ROUNDS = 10;
