// La machine à états de la série et du score. Deux fonctions PURES : aucune
// lecture d'horloge, aucun accès au stockage. Le jour courant est toujours
// passé en argument, ce qui rend chaque transition testable directement.

import { streakMultiplier } from "./scoring";
import type { Persisted, Progress, PuzzleId, PuzzleProgress } from "./types";

// Appelée au chargement : aligne l'état persisté sur le jour courant.
//
// - dernier jour joué === aujourd'hui   → rien à faire
// - dernier jour joué === hier          → série intacte, journée pas encore jouée
// - dernier jour joué plus ancien       → un jour a été manqué : série et score courant à zéro
//
// Le record n'a rien à faire ici : il est maintenu au fil de l'eau par
// `commitPuzzle`, donc il est déjà à sa valeur maximale quand on arrive ici.
export function reconcile(state: Persisted, today: number): Persisted {
  const progress = state.progress?.day === today ? state.progress : null;
  const { lastPlayedDay } = state.meta;

  // `lastPlayedDay > today` n'arrive pas avec une horloge UTC monotone, mais
  // arrive si le joueur recule l'horloge de sa machine. On traite ce cas comme
  // une rupture : sinon une série resterait accrochée à un score qu'elle ne
  // pourrait plus justifier.
  const jamaisJoue = lastPlayedDay < 0;
  const serieRompue =
    !jamaisJoue && (lastPlayedDay < today - 1 || lastPlayedDay > today);
  const meta = serieRompue
    ? { ...state.meta, streak: 0, runScore: 0 }
    : state.meta;

  return { ...state, meta, progress };
}

// Appelée quand une grille atteint un statut terminal (gagnée OU perdue).
//
// `drawnDay` est le jour sous lequel la grille a été tirée : s'il ne correspond
// plus au jour courant, la bascule a eu lieu pendant la partie et le résultat
// est écarté (sans quoi une partie de la veille créditerait le lendemain).
export function commitPuzzle(
  state: Persisted,
  today: number,
  id: PuzzleId,
  result: PuzzleProgress,
  drawnDay: number = today,
): Persisted {
  // On écarte CE résultat, pas la journée : `reconcile` ne jette la progression
  // que si elle date d'un jour révolu. Rendre `progress: null` sans condition
  // effacerait les grilles légitimement terminées aujourd'hui — qui
  // redeviendraient alors marquables une seconde fois.
  if (drawnDay !== today) return reconcile(state, today);

  const base = reconcile(state, today);
  const progress: Progress = base.progress ?? { day: today, puzzles: {} };

  // Une grille déjà terminée aujourd'hui ne rapporte pas deux fois.
  const dejaTerminee =
    progress.puzzles[id]?.status !== undefined &&
    progress.puzzles[id]?.status !== "playing";
  if (dejaTerminee) return base;

  // La série se met à jour au PREMIER résultat de la journée, avant le calcul
  // du multiplicateur : le premier jour d'une série est donc bien à ×1.
  const premiereDuJour = base.meta.lastPlayedDay !== today;
  const streak = premiereDuJour
    ? base.meta.lastPlayedDay === today - 1
      ? base.meta.streak + 1
      : 1
    : base.meta.streak;

  const runScore =
    base.meta.runScore + Math.round(result.points * streakMultiplier(streak));

  return {
    ...base,
    meta: {
      streak,
      lastPlayedDay: today,
      runScore,
      recordScore: Math.max(base.meta.recordScore, runScore),
    },
    progress: { day: today, puzzles: { ...progress.puzzles, [id]: result } },
  };
}

// Enregistre l'avancement d'une grille NON terminée (reprise après rafraîchissement).
// Ne touche ni la série ni les scores.
//
// `drawnDay` joue le même rôle que dans `commitPuzzle`, et pour la même raison :
// un onglet ouvert avant la bascule continue de sauvegarder après. Sans ce
// garde-fou, l'état d'une partie de la veille serait réécrit sous la date du
// jour, et la grille du lendemain reprendrait avec les essais de la veille —
// évalués contre une autre réponse.
export function saveProgress(
  state: Persisted,
  today: number,
  id: PuzzleId,
  gameState: unknown,
  drawnDay: number = today,
): Persisted {
  if (drawnDay !== today) return reconcile(state, today);

  const base = reconcile(state, today);
  const progress: Progress = base.progress ?? { day: today, puzzles: {} };
  if (
    progress.puzzles[id]?.status !== undefined &&
    progress.puzzles[id]?.status !== "playing"
  ) {
    return base; // grille déjà terminée : on ne réécrit pas par-dessus
  }
  return {
    ...base,
    progress: {
      day: today,
      puzzles: {
        ...progress.puzzles,
        [id]: { status: "playing", points: 0, state: gameState },
      },
    },
  };
}
