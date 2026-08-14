"use client";

// Plomberie commune aux trois jeux : le jour courant, la reprise après
// rafraîchissement, et l'enregistrement du résultat. Les jeux ne parlent jamais
// directement au stockage — uniquement à ce hook.

import { useCallback, useEffect, useRef } from "react";
import { useState } from "react";
import { dayIndex } from "./clock";
import { dailyStore, useDailyState, useHydrated } from "./store";
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

type Options<S> = {
  id: PuzzleId;
  day: number; // jour du TIRAGE
  state: S; // état de jeu courant, celui qu'on sauvegarde
  onRestore: (state: S) => void; // doit être stable (useCallback)
  savable: boolean; // partie en cours ET quotidienne
};

// Reprise et sauvegarde d'une grille du jour, dans UN SEUL effet.
//
// Les deux tiennent dans le même effet parce que leur ORDRE est le bug. Au
// premier rendu client, `useSyncExternalStore` rend encore l'instantané SERVEUR
// — un stockage vide. Séparés en deux effets, la reprise ne voit donc rien à
// restaurer, tandis que la sauvegarde, elle, s'exécute aussitôt et écrit la
// grille vierge par-dessus la partie enregistrée : elle est perdue avant même
// que le vrai stockage n'ait été lu.
//
// Ce n'était pas qu'une perte de progression : le compteur d'essais repartant
// de zéro, un simple rafraîchissement redonnait le score maximal sur une grille
// déjà à moitié jouée.
//
// Ici, la première passe pour une grille donnée tranche la reprise et REND LA
// MAIN sans écrire. La passe suivante — déclenchée par le changement d'état que
// la reprise vient de provoquer — sauvegarde l'état restauré.
export function useDailyPuzzle<S>({
  id,
  day,
  state,
  onRestore,
  savable,
}: Options<S>) {
  const persisted = useDailyState();
  const hydrated = useHydrated();
  const entry =
    persisted.progress?.day === day
      ? persisted.progress.puzzles[id]
      : undefined;
  const saved = entry?.state as S | undefined;

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

  // Dernière grille dont la reprise a été tranchée. Un ref, pas un état : on ne
  // le lit que dans l'effet, et le modifier ne doit pas provoquer de rendu.
  const repriseTranchee = useRef<PuzzleId | null>(null);

  useEffect(() => {
    if (!hydrated) return;

    if (repriseTranchee.current !== id) {
      repriseTranchee.current = id;
      if (saved !== undefined) {
        onRestore(saved);
        return; // surtout pas de sauvegarde avant que la reprise ait atterri
      }
    }

    if (savable) save(state);
  }, [hydrated, id, saved, onRestore, savable, state, save]);

  return {
    // La grille du jour est-elle déjà terminée ?
    done: entry !== undefined && entry.status !== "playing",
    points: entry?.points ?? 0,
    commit,
  };
}
