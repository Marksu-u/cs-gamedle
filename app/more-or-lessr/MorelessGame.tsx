"use client";

import { useEffect, useMemo, useReducer, useState } from "react";
import GameMenu, { type GameMenuItem } from "@/components/GameMenu";
import HelpModal from "@/components/HelpModal";
import CategorySelect from "@/components/more-or-lessr/CategorySelect";
import ChainBoard from "@/components/more-or-lessr/ChainBoard";
import ResultBanner from "@/components/more-or-lessr/ResultBanner";
import type { MorelessData } from "@/lib/more-or-lessr/types";
import { createInitialState, createMorelessReducer } from "./reducer";

const REVEAL_MS = 1400; // temps d'affichage du résultat avant le round suivant

export default function MorelessGame({ data }: { data: MorelessData }) {
  // Reducer mémoïsé : créé une fois côté client (fige la date du jour pour la session).
  const reducer = useMemo(() => createMorelessReducer(data), [data]);
  const [state, dispatch] = useReducer(reducer, undefined, createInitialState);
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
      label: "Aide",
      icon: "help",
      onSelect: () => setHelpOpen(true),
    },
    {
      id: "give-up",
      label: "Abandonner",
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
          onReplay={() => dispatch({ type: "REPLAY" })}
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
        title="Comment jouer"
      >
        <ul className="list-disc space-y-2 pl-4">
          <li>Choisis une catégorie : rating HLTV ou gains en carrière.</li>
          <li>
            Deux joueurs s’affichent : la valeur de gauche (l’ancre) est
            visible, celle du challenger est cachée.
          </li>
          <li>
            Devine si le challenger a une valeur plus <strong>HAUTE</strong> ou
            plus <strong>BASSE</strong> que l’ancre.
          </li>
          <li>
            Bonne réponse : +1 point, la chaîne continue — le challenger devient
            la nouvelle ancre.
          </li>
          <li>Mauvaise réponse : la partie est terminée.</li>
          <li>Ton score est la longueur de ta série de bonnes réponses.</li>
          <li>
            Abandonner termine la partie immédiatement en gardant le score
            acquis.
          </li>
        </ul>
      </HelpModal>
    </div>
  );
}
