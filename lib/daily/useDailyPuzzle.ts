"use client";

// Plomberie commune aux trois jeux : le jour courant, la reprise après
// rafraîchissement, et l'enregistrement du résultat. Les jeux ne parlent jamais
// directement au stockage — uniquement à ce hook.

import { useCallback, useEffect, useState } from "react";
import { dayIndex } from "./clock";
import { dailyStore, useDailyState } from "./store";
import type { PuzzleId, PuzzleProgress } from "./types";

export function useDay(): number {
  // Figé pour la durée du montage : une bascule en cours de partie est traitée
  // à la validation du résultat (cf. commitPuzzle), pas par un re-rendu.
  // L'initialiseur paresseux de `useState` n'est exécuté qu'au premier rendu,
  // ce qui fige la valeur sans passer par un ref (interdit en lecture pendant
  // le rendu par la règle `react-hooks/refs`).
  const [day] = useState(() => dayIndex());
  return day;
}

export function useDailyPuzzle<S>(id: PuzzleId, day: number) {
  const state = useDailyState();
  const entry =
    state.progress?.day === day ? state.progress.puzzles[id] : undefined;

  // `useCallback` n'est PAS cosmétique ici. `save` et `commit` sont des
  // dépendances d'effets qui écrivent dans le store ; le store notifie, le
  // composant se re-rend. Sans identité stable, l'effet se redéclencherait à
  // chaque rendu et boucherait à l'infini.
  const save = useCallback(
    (gameState: S) => dailyStore.saveProgress(day, id, gameState),
    [day, id],
  );
  // `day` est le jour du TIRAGE. Le store relit l'horloge au moment de
  // l'écriture : c'est l'écart entre les deux qui fait exister le garde-fou
  // « bascule pendant la partie ».
  const commit = useCallback(
    (result: PuzzleProgress) => dailyStore.commit(day, id, result),
    [day, id],
  );

  return {
    // État sauvegardé à restaurer, ou `undefined` si rien à reprendre.
    saved: entry?.state as S | undefined,
    // La grille du jour est-elle déjà terminée ?
    done: entry !== undefined && entry.status !== "playing",
    points: entry?.points ?? 0,
    save,
    commit,
  };
}

// Enregistre `state` à chaque changement, tant que la partie est en cours.
// `save` doit être stable (cf. useDailyPuzzle) sous peine de boucle de rendu.
export function useAutoSave<S>(save: (s: S) => void, state: S, actif: boolean) {
  useEffect(() => {
    if (!actif) return;
    save(state);
  }, [save, state, actif]);
}
