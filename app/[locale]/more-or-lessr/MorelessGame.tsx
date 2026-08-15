"use client";

import { useCallback, useEffect, useMemo, useReducer, useState } from "react";
import GameMenu, { type GameMenuItem } from "@/components/GameMenu";
import HelpModal from "@/components/HelpModal";
import CategorySelect from "@/components/more-or-lessr/CategorySelect";
import ChainBoard from "@/components/more-or-lessr/ChainBoard";
import ResultBanner from "@/components/more-or-lessr/ResultBanner";
import { molPoints } from "@/lib/daily/scoring";
import { useTranslations } from "next-intl";
import { useDailyPuzzle, useDay } from "@/lib/daily/useDailyPuzzle";
import type { PuzzleId } from "@/lib/daily/types";
import type { GameState, MorelessData } from "@/lib/more-or-lessr/types";
import { createInitialState, createMorelessReducer } from "./reducer";

const REVEAL_MS = 1400; // temps d'affichage du résultat avant le round suivant

export default function MorelessGame({ data }: { data: MorelessData }) {
  const t = useTranslations("moreOrLessr");
  const menu = useTranslations("menu");
  const game = useTranslations("game");
  const day = useDay();
  // Reducer mémoïsé : fermé sur `data` + le jour (fige la grille du jour pour la session).
  const reducer = useMemo(() => createMorelessReducer(data, day), [data, day]);
  const [state, dispatch] = useReducer(reducer, undefined, () =>
    createInitialState(day),
  );

  // La catégorie choisie détermine la grille quotidienne concernée.
  const puzzleId = (
    state.category ? `mol-${state.category}` : "mol-rating"
  ) as PuzzleId;
  // La reprise est tranchée PAR catégorie par le hook : passer de « rating » à
  // « prize » doit restaurer la manche de prize, pas repartir de zéro.
  const restaurer = useCallback(
    (s: GameState) => dispatch({ type: "RESTORE", state: s }),
    [],
  );
  const { done, points, commit } = useDailyPuzzle<GameState>({
    id: puzzleId,
    day,
    state,
    onRestore: restaurer,
    savable:
      state.mode === "daily" &&
      (state.status === "playing" || state.status === "revealed"),
  });

  useEffect(() => {
    if (state.mode !== "daily" || state.status !== "finished" || done) return;
    commit({ status: "won", points: molPoints(state.score), state });
  }, [state, done, commit]);

  const [helpOpen, setHelpOpen] = useState(false);

  // Après un choix (status "revealed"), on laisse voir le résultat puis on avance.
  useEffect(() => {
    if (state.status !== "revealed") return;
    const id = setTimeout(() => dispatch({ type: "NEXT" }), REVEAL_MS);
    return () => clearTimeout(id);
  }, [state.status, state.round]);

  // Pas d'indice pour ce jeu : le menu ne propose que l'aide et l'abandon.
  const menuItems: GameMenuItem[] = [
    {
      id: "help",
      label: menu("help"),
      icon: "help",
      onSelect: () => setHelpOpen(true),
    },
    {
      id: "give-up",
      label: menu("giveUp"),
      icon: "giveup",
      disabled: state.status === "select" || state.status === "finished",
      onSelect: () => dispatch({ type: "GIVE_UP" }),
    },
  ];

  return (
    <div className="flex w-full max-w-3xl flex-col items-center gap-4">
      <div className="flex w-full justify-end">
        <GameMenu items={menuItems} />
      </div>

      {state.status === "select" && (
        <CategorySelect
          onSelect={(category) => dispatch({ type: "START", category })}
        />
      )}

      {state.status === "finished" && (
        <ResultBanner
          score={state.score}
          points={points}
          practice={state.mode === "practice"}
          onReplay={() => dispatch({ type: "PRACTICE" })}
          onChangeCategory={() =>
            dispatch({
              type: "START",
              category: state.category === "rating" ? "prize" : "rating",
            })
          }
        />
      )}

      {/* playing | revealed : anchor & challenger sont garantis non-nuls. */}
      {(state.status === "playing" || state.status === "revealed") && (
        <ChainBoard
          anchor={state.anchor!}
          challenger={state.challenger!}
          category={state.category!}
          round={state.round}
          score={state.score}
          revealed={state.status === "revealed"}
          lastGuess={state.lastGuess}
          lastCorrect={state.lastCorrect}
          onGuess={(direction) => dispatch({ type: "GUESS", direction })}
        />
      )}

      <HelpModal
        open={helpOpen}
        onClose={() => setHelpOpen(false)}
        title={game("howToPlay")}
      >
        <ul className="list-disc space-y-2 pl-4">
          {(t.raw("help.items") as string[]).map((_, i) => (
            <li key={i}>{t(`help.items.${i}`)}</li>
          ))}
        </ul>
      </HelpModal>
    </div>
  );
}
