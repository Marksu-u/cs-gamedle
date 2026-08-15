"use client";

import { useCallback, useEffect, useMemo, useReducer, useState } from "react";
import GameMenu, { type GameMenuItem } from "@/components/GameMenu";
import HelpModal from "@/components/HelpModal";
import GuessGrid from "@/components/guessr/GuessGrid";
import GuessInput from "@/components/guessr/GuessInput";
import ResultBanner from "@/components/guessr/ResultBanner";
import { MAX_HINTS } from "@/lib/guessr/hints";
import { guessrPoints } from "@/lib/daily/scoring";
import { useTranslations } from "next-intl";
import { useDailyPuzzle, useDay } from "@/lib/daily/useDailyPuzzle";
import type { GameState, GuessrData } from "@/lib/guessr/types";
import { createGuessrReducer, createInitialState } from "./reducer";

export default function GuessrGame({ data }: { data: GuessrData }) {
  const t = useTranslations("guessr");
  const menu = useTranslations("menu");
  const game = useTranslations("game");
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

  // Names already guessed → derived from guess rows only.
  const guessedNames = state.rows.flatMap((r) =>
    r.kind === "guess" ? [r.result.player.name] : [],
  );
  const hintsUsed = state.rows.filter((r) => r.kind === "hint").length;
  // Hint rows are not tries: counting them displayed "found in 5 tries" for 3
  // guesses and 2 hints, while the points calculation correctly counted 3.
  const guessCount = guessedNames.length;

  const menuItems: GameMenuItem[] = [
    {
      id: "hint",
      label: menu("hint"),
      icon: "hint",
      note: `${hintsUsed}/${MAX_HINTS}`,
      disabled: hintsUsed >= MAX_HINTS || state.status !== "playing",
      onSelect: () => dispatch({ type: "HINT" }),
    },
    {
      id: "help",
      label: menu("help"),
      icon: "help",
      onSelect: () => setHelpOpen(true),
    },
    {
      id: "giveup",
      label: menu("giveUp"),
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
          attempts={guessCount}
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
          attempts={guessCount}
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
        title={game("howToPlay")}
      >
        <ul className="space-y-2">
          {(t.raw("help.items") as string[]).map((_, i) => (
            <li key={i}>{t(`help.items.${i}`, { maxHints: MAX_HINTS })}</li>
          ))}
        </ul>
      </HelpModal>
    </div>
  );
}
