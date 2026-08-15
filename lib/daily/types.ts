// Types de la couche quotidienne, partagés par les trois jeux.

// Identifiant stable d'une grille quotidienne. Sert de clé de flux pour le
// tirage ET de clé de progression dans le stockage — les deux doivent coïncider.
export type PuzzleId =
  | "wordle-3"
  | "wordle-4"
  | "wordle-5"
  | "wordle-6"
  | "wordle-7"
  | "wordle-8"
  | "guessr"
  | "mol-rating"
  | "mol-prize";


// Une grille est soit en cours, soit terminée (gagnée ou perdue). L'abandon
// compte comme terminé : la journée est jouée, les points valent 0.
export type PuzzleStatus = "playing" | "won" | "lost";

// Progression d'une grille du jour. `state` est l'état de jeu sérialisé du
// reducer concerné — opaque ici, chaque jeu sait relire le sien.
export type PuzzleProgress = {
  status: PuzzleStatus;
  points: number; // points bruts, avant multiplicateur ; 0 tant que status === "playing"
  state: unknown; // état du reducer, pour reprendre après un rafraîchissement
};

// Ce qui survit à la rotation.
export type Meta = {
  streak: number;
  lastPlayedDay: number; // dayIndex du dernier jour avec >= 1 grille terminée ; -1 si jamais joué
  runScore: number; // score courant, remis à zéro si un jour est manqué
  recordScore: number; // meilleur runScore jamais atteint, jamais remis à zéro
};

// Ce qui est jeté à chaque rotation.
export type Progress = {
  day: number;
  puzzles: Partial<Record<PuzzleId, PuzzleProgress>>;
};

// La forme complète écrite dans localStorage.
export type Persisted = {
  version: 1;
  meta: Meta;
  progress: Progress | null;
};

export const STORAGE_KEY = "cs-gamedle:v1";
export const STORAGE_VERSION = 1;

export const EMPTY_META: Meta = {
  streak: 0,
  lastPlayedDay: -1,
  runScore: 0,
  recordScore: 0,
};

export const EMPTY_PERSISTED: Persisted = {
  version: STORAGE_VERSION,
  meta: EMPTY_META,
  progress: null,
};
