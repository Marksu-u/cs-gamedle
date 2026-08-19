"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
} from "react";
import Board from "@/components/wordle/Board";
import Keyboard from "@/components/wordle/Keyboard";
import SlotTabs from "@/components/wordle/SlotTabs";
import ResultBanner from "@/components/wordle/ResultBanner";
import GameMenu, { type GameMenuItem } from "@/components/GameMenu";
import HelpModal from "@/components/HelpModal";
import { deriveKeyStates } from "@/lib/wordle/engine";
import { dailyTags } from "@/lib/wordle/selection";
import { wordlePoints } from "@/lib/daily/scoring";
import { useTranslations } from "next-intl";
import { useDailyPuzzle, useDay } from "@/lib/daily/useDailyPuzzle";
import type { PuzzleId } from "@/lib/daily/types";
import {
  MAX_HINTS,
  type BoardState,
  type WordleData,
} from "@/lib/wordle/types";
import {
  createInitialState,
  createWordleReducer,
  hintCandidates,
} from "./reducer";

export default function WordleGame({
  data,
  guessrTarget,
}: {
  data: WordleData;
  guessrTarget?: string;
}) {
  const t = useTranslations("wordle");
  const menu = useTranslations("menu");
  const game = useTranslations("game");
  const day = useDay();
  const tags = useMemo(
    () => dailyTags(data, day, guessrTarget),
    [data, day, guessrTarget],
  );
  // Widest tag of the day: sizes the tiles of EVERY board uniformly (see Board),
  // so the longest grid still fits on screen.
  const maxLength = Math.max(...tags.map((t) => t.length));

  // Memoised reducer (closes over the dictionary + the day, stable). The lazy
  // init draws the tags client-side; since the targets are never rendered, there
  // is no hydration mismatch.
  const reducer = useMemo(() => createWordleReducer(data, day), [data, day]);
  const [state, dispatch] = useReducer(reducer, undefined, () =>
    createInitialState(tags, day),
  );
  const board = state.boards[state.activeSlot];

  // Each slot is an independent daily puzzle with its own storage entry, so we
  // persist the BOARD, not the whole WordleState.
  const puzzleId = `wordle-${board.slot + 1}` as PuzzleId;
  // The hook owns the resume and settles it PER puzzle: the player can open the
  // fifth slot long after the page loaded.
  const restaurer = useCallback(
    (b: BoardState) => dispatch({ type: "RESTORE_BOARD", board: b }),
    [],
  );
  const { done, points, commit } = useDailyPuzzle<BoardState>({
    id: puzzleId,
    day,
    state: board,
    onRestore: restaurer,
    savable: board.mode === "daily" && board.status === "playing",
  });

  // Records the result as soon as a daily puzzle finishes.
  useEffect(() => {
    if (board.mode !== "daily" || board.status === "playing" || done) return;
    commit({
      status: board.status === "won" ? "won" : "lost",
      points: wordlePoints({
        length: board.length,
        attempt: board.guesses.length,
        hints: board.hintedChars.length,
        won: board.status === "won",
      }),
      state: board,
    });
  }, [board, done, commit]);

  // Press highlight: briefly lights the key matching the last character produced
  // (physical typing OR click). Purely visual state, outside the reducer.
  const [flashKey, setFlashKey] = useState<string | null>(null);
  const flashTimer = useRef<number | null>(null);
  function flash(label: string) {
    setFlashKey(label);
    if (flashTimer.current) window.clearTimeout(flashTimer.current);
    flashTimer.current = window.setTimeout(() => setFlashKey(null), 150);
  }

  // Single set of handlers shared by the physical and on-screen keyboards (DRY):
  // each input lights the key then dispatches the action.
  function input(char: string) {
    flash(char.toUpperCase());
    dispatch({ type: "KEY_INPUT", char });
  }
  function submit() {
    flash("ENTER");
    dispatch({ type: "SUBMIT" });
  }
  function del() {
    flash("DEL");
    dispatch({ type: "DELETE" });
  }

  // Physical keyboard: event.key gives the character actually produced, so input
  // works whatever the physical layout (QWERTY/AZERTY/…). Bound once; the handlers
  // only use stable references (dispatch, refs).
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Enter") submit();
      else if (e.key === "Backspace") del();
      else if (/^[a-zA-Z0-9]$/.test(e.key)) input(e.key);
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // `invalid` triggers the shake; it is cleared once the animation is done.
  useEffect(() => {
    if (!board.invalid) return;
    const id = setTimeout(() => dispatch({ type: "CLEAR_INVALID" }), 400);
    return () => clearTimeout(id);
  }, [board.invalid]);

  // Help modal (game rules).
  const [helpOpen, setHelpOpen] = useState(false);

  // Hint popup: briefly shows the LAST hinted letter as an overlay. We remember
  // the previous length of hintedChars so it only fires on a real ADDITION — not
  // on the first render, nor on a tab switch (where the active board may already
  // carry hints).
  const [hintPop, setHintPop] = useState<string | null>(null);
  const prevHintCount = useRef(board.hintedChars.length);
  useEffect(() => {
    const count = board.hintedChars.length;
    if (count > prevHintCount.current) {
      setHintPop(board.hintedChars[count - 1]);
      const id = setTimeout(() => setHintPop(null), 1100);
      prevHintCount.current = count;
      return () => clearTimeout(id);
    }
    // Resync without a popup (e.g. tab switch, or PRACTICE resetting the board).
    prevHintCount.current = count;
  }, [board.hintedChars]);

  // The keyboard also reflects hinted characters (marked "present").
  const keyStates = deriveKeyStates(
    board.guesses,
    board.evaluations,
    board.hintedChars,
  );

  // Side actions gathered in the "Options" menu.
  const menuItems: GameMenuItem[] = [
    {
      id: "hint",
      label: menu("hint"),
      icon: "hint",
      // The cap is enforced by the reducer; without these two lines the button
      // stayed lit past the limit and silently did nothing.
      note: `${board.hintedChars.length}/${MAX_HINTS}`,
      disabled:
        board.status !== "playing" ||
        board.hintedChars.length >= MAX_HINTS ||
        hintCandidates(board).length === 0,
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
      disabled: board.status !== "playing",
      onSelect: () => dispatch({ type: "GIVE_UP" }),
    },
  ];

  return (
    <div className="flex w-full max-w-lg flex-col items-center gap-5">
      <SlotTabs
        boards={state.boards}
        active={state.activeSlot}
        onSelect={(slot) => dispatch({ type: "SELECT_SLOT", slot })}
      />
      {/* key={activeSlot}: remounts the subtree on a tab switch, which replays
          the entry animation. */}
      <div
        key={state.activeSlot}
        className="flex w-full animate-[wordle-tab_0.25s_ease] flex-col items-center gap-5"
      >
        {/* Side-action menu, right-aligned just above the board. */}
        <div className="flex w-full justify-end">
          <GameMenu items={menuItems} />
        </div>
        <Board board={board} maxLength={maxLength} />
        <ResultBanner
          board={board}
          points={points}
          onPractice={() => dispatch({ type: "PRACTICE" })}
        />
      </div>
      <Keyboard
        keyStates={keyStates}
        flashKey={flashKey}
        onKey={input}
        onEnter={submit}
        onDelete={del}
      />

      {/* Hint popup: large centred golden tile, fades after ~1.1s. */}
      {hintPop && (
        <div className="pointer-events-none fixed inset-0 z-40 flex items-center justify-center">
          <div className="cs2-display animate-[hint-pop_1.1s_ease_forwards] rounded-xl bg-[var(--wordle-present)] px-8 py-6 text-6xl font-extrabold text-black">
            {hintPop}
          </div>
        </div>
      )}

      <HelpModal
        open={helpOpen}
        onClose={() => setHelpOpen(false)}
        title={game("howToPlay")}
      >
        <ul className="space-y-2">
          {(t.raw("help.items") as string[]).map((_, i) => (
            <li key={i}>{t(`help.items.${i}`)}</li>
          ))}
        </ul>
      </HelpModal>
    </div>
  );
}
