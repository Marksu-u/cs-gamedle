import { deriveKeyStates, evaluateGuess, isWin } from "@/lib/wordle/engine";
import { getGroup, isValidGuess, practiceTags } from "@/lib/wordle/selection";
import {
  MAX_ATTEMPTS,
  MAX_HINTS,
  type BoardState,
  type GameStatus,
  type WordleData,
  type WordleState,
} from "@/lib/wordle/types";

export type WordleAction =
  | { type: "SELECT_SLOT"; slot: number }
  | { type: "KEY_INPUT"; char: string }
  | { type: "DELETE" }
  | { type: "SUBMIT" }
  | { type: "CLEAR_INVALID" }
  | { type: "PRACTICE" }
  | { type: "RESTORE_BOARD"; board: BoardState }
  | { type: "HINT" }
  | { type: "GIVE_UP" };

// Target characters still "hidden": neither present/correct on the keyboard, nor already hinted.
export function hintCandidates(board: BoardState): string[] {
  const revealed = deriveKeyStates(
    board.guesses,
    board.evaluations,
    board.hintedChars,
  );
  return [...new Set(board.target.toUpperCase())].filter((ch) => {
    const s = revealed.get(ch) ?? "unused";
    return s !== "present" && s !== "correct";
  });
}

export function createBoard(
  target: string,
  slot: number,
  day: number,
  mode: "daily" | "practice" = "daily",
): BoardState {
  return {
    target,
    slot,
    length: target.length,
    guesses: [],
    evaluations: [],
    current: "",
    status: "playing",
    invalid: false,
    hintedChars: [],
    mode,
    day,
  };
}

// All five boards exist from the start. Under the old model boards were built
// lazily on a tab's first visit, because six independent puzzles meant six
// independent draws; the day's five tags come out of one draw and there is
// nothing to defer.
export function createInitialState(tags: string[], day: number): WordleState {
  return {
    activeSlot: 0,
    boards: tags.map((target, slot) => createBoard(target, slot, day)),
  };
}

// Replaces one board without touching the others. Indexed by slot, so two
// same-length nicknames no longer overwrite each other.
function withBoard(state: WordleState, b: BoardState): WordleState {
  const boards = [...state.boards];
  boards[b.slot] = b;
  return { ...state, boards };
}

// Factory: the reducer closes over `data` + the day. It stays pure (deterministic
// given `data`/`day`) and testable, while keeping the random word draw
// hors des composants.
export function createWordleReducer(data: WordleData, day: number) {
  return function reducer(
    state: WordleState,
    action: WordleAction,
  ): WordleState {
    const board = state.boards[state.activeSlot];

    switch (action.type) {
      case "SELECT_SLOT": {
        if (action.slot < 0 || action.slot >= state.boards.length) return state;
        return { ...state, activeSlot: action.slot };
      }

      case "KEY_INPUT": {
        if (board.status !== "playing" || board.current.length >= board.length)
          return state;
        const ch = action.char.toUpperCase();
        if (!/^[A-Z0-9]$/.test(ch)) return state;
        return withBoard(state, { ...board, current: board.current + ch });
      }

      case "DELETE": {
        if (board.status !== "playing") return state;
        return withBoard(state, {
          ...board,
          current: board.current.slice(0, -1),
        });
      }

      case "SUBMIT": {
        if (board.status !== "playing") return state;
        // Rejected (→ shake, no try consumed) if incomplete or an unknown tag.
        if (
          board.current.length < board.length ||
          !isValidGuess(getGroup(data, board.length), board.current)
        ) {
          return withBoard(state, { ...board, invalid: true });
        }
        const states = evaluateGuess(board.current, board.target);
        const guesses = [...board.guesses, board.current];
        const evaluations = [...board.evaluations, states];
        let status: GameStatus = "playing";
        if (isWin(states)) status = "won";
        else if (guesses.length >= MAX_ATTEMPTS) status = "lost";
        return withBoard(state, {
          ...board,
          guesses,
          evaluations,
          current: "",
          status,
          invalid: false,
        });
      }

      case "CLEAR_INVALID": {
        if (!board.invalid) return state;
        return withBoard(state, { ...board, invalid: false });
      }

      case "RESTORE_BOARD":
        return withBoard(state, action.board);

      case "PRACTICE": {
        // Re-rolls every slot, skipping the tags already on screen so "Play
        // again" never hands back the board just finished.
        const tags = practiceTags(
          data,
          state.boards.map((b) => b.target),
        );
        return {
          activeSlot: 0,
          boards: tags.map((target, slot) =>
            createBoard(target, slot, day, "practice"),
          ),
        };
      }

      case "HINT": {
        if (board.status !== "playing") return state;
        if (board.hintedChars.length >= MAX_HINTS) return state; // cap
        const candidates = hintCandidates(board);
        if (candidates.length === 0) return state;
        const ch = candidates[Math.floor(Math.random() * candidates.length)];
        return withBoard(state, {
          ...board,
          hintedChars: [...board.hintedChars, ch],
        });
      }

      case "GIVE_UP": {
        if (board.status !== "playing") return state;
        return withBoard(state, { ...board, status: "lost" });
      }

      default:
        return state;
    }
  };
}
