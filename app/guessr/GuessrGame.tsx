"use client";

import { useCallback, useEffect, useMemo, useReducer, useState } from "react";
import GameMenu, { type GameMenuItem } from "@/components/GameMenu";
import HelpModal from "@/components/HelpModal";
import GuessGrid from "@/components/guessr/GuessGrid";
import GuessInput from "@/components/guessr/GuessInput";
import ResultBanner from "@/components/guessr/ResultBanner";
import { MAX_HINTS } from "@/lib/guessr/hints";
import { guessrPoints } from "@/lib/daily/scoring";
import { useDailyPuzzle, useDay } from "@/lib/daily/useDailyPuzzle";
import type { GameState, GuessrData } from "@/lib/guessr/types";
import { createGuessrReducer, createInitialState } from "./reducer";

export default function GuessrGame({ data }: { data: GuessrData }) {
  const day = useDay();
  const reducer = useMemo(() => createGuessrReducer(data, day), [data, day]);
  const [state, dispatch] = useReducer(reducer, undefined, () =>
    createInitialState(data, day),
  );
  const restaurer = useCallback(
    (s: GameState) => dispatch({ type: "RESTORE", state: s }),
    [],
  );
  const { done, points, commit } = useDailyPuzzle<GameState>({
    id: "guessr",
    day,
    state,
    onRestore: restaurer,
    savable: state.mode === "daily" && state.status === "playing",
  });

  useEffect(() => {
    if (state.mode !== "daily" || state.status === "playing" || done) return;
    const guesses = state.rows.filter((r) => r.kind === "guess").length;
    const hints = state.rows.filter((r) => r.kind === "hint").length;
    commit({
      status: state.status === "won" ? "won" : "lost",
      points: guessrPoints({ guesses, hints, won: state.status === "won" }),
      state,
    });
  }, [state, done, commit]);

  const [helpOpen, setHelpOpen] = useState(false);

  // Noms déjà proposés → dérivés des lignes guess uniquement.
  const guessedNames = state.rows.flatMap((r) =>
    r.kind === "guess" ? [r.result.player.name] : [],
  );
  const hintsUsed = state.rows.filter((r) => r.kind === "hint").length;

  const menuItems: GameMenuItem[] = [
    {
      id: "hint",
      label: "Indice",
      icon: "hint",
      note: `${hintsUsed}/${MAX_HINTS}`,
      disabled: hintsUsed >= MAX_HINTS || state.status !== "playing",
      onSelect: () => dispatch({ type: "HINT" }),
    },
    {
      id: "help",
      label: "Aide",
      icon: "help",
      onSelect: () => setHelpOpen(true),
    },
    {
      id: "giveup",
      label: "Abandonner",
      icon: "giveup",
      disabled: state.status !== "playing",
      onSelect: () => dispatch({ type: "GIVE_UP" }),
    },
  ];

  return (
    <div className="flex w-full max-w-3xl flex-col items-center gap-5">
      <div className="flex w-full justify-end">
        <GameMenu items={menuItems} />
      </div>

      {state.status === "playing" && (
        <GuessInput
          players={data.players}
          guessedNames={guessedNames}
          onGuess={(name) => dispatch({ type: "GUESS", name })}
        />
      )}

      {state.status === "won" && (
        <ResultBanner
          target={state.target}
          attempts={state.rows.length}
          points={points}
          hints={hintsUsed}
          practice={state.mode === "practice"}
          onPractice={() => dispatch({ type: "PRACTICE" })}
        />
      )}

      {state.status === "gaveup" && (
        <ResultBanner
          gaveUp
          target={state.target}
          attempts={state.rows.length}
          points={points}
          hints={hintsUsed}
          practice={state.mode === "practice"}
          onPractice={() => dispatch({ type: "PRACTICE" })}
        />
      )}

      <GuessGrid rows={state.rows} />

      <HelpModal
        open={helpOpen}
        onClose={() => setHelpOpen(false)}
        title="Comment jouer"
      >
        <ul className="space-y-2">
          <li>🎯 Trouve le joueur pro CS mystère.</li>
          <li>
            ⌨️ Propose un pseudo du pool : chaque proposition remplit une ligne
            comparant 7 attributs.
          </li>
          <li>🟩 Vert = valeur exacte.</li>
          <li>🟨 Orange = partiellement commun (anciennes équipes / rôles).</li>
          <li>⬜ Gris = aucun lien.</li>
          <li>
            ▲ = la valeur de la cible est plus haute, ▼ plus basse (âge, majors,
            tournois).
          </li>
          <li>♾️ Essais illimités.</li>
          <li>
            💡 L’indice révèle une colonne de la réponse mais compte comme un
            essai (max {MAX_HINTS}).
          </li>
        </ul>
      </HelpModal>
    </div>
  );
}
