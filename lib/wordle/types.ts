// Types partagés du Wordle. Volontairement génériques (pas spécifiques à CS2)
// pour rester réutilisables sur un autre univers.

// État d'une tuile après évaluation. "empty" = case non encore jouée.
export type TileState = "correct" | "present" | "absent" | "empty";

// État d'une touche du clavier (agrégé sur tous les essais). "unused" = jamais tapée.
export type KeyState = "correct" | "present" | "absent" | "unused";

export type GameStatus = "playing" | "won" | "lost";

// Forme du JSON de données (app/data/<jeu>/wordle.json).
export type WordleData = { game: string; words: Record<string, string[]> };

// État d'une grille (un board par longueur de mot).
export type BoardState = {
  target: string;
  length: number;
  guesses: string[]; // essais soumis
  evaluations: TileState[][]; // coloriage par essai (même index que guesses)
  current: string; // saisie en cours (non soumise)
  status: GameStatus;
  invalid: boolean; // flag transitoire : déclenche le shake puis est remis à false
  hintedChars: string[]; // caractères révélés via indice (affichés "present" au clavier)
};

// État global : tous les boards + l'onglet actif.
export type WordleState = {
  activeLength: number;
  boards: Record<number, BoardState>;
};

// 6 essais comme le Wordle classique (cf. data/modes.ts).
export const MAX_ATTEMPTS = 6;
