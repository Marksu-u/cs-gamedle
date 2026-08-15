import { deriveKeyStates, evaluateGuess, isWin } from "@/lib/wordle/engine";
import {
  dailyWord,
  getGroup,
  isValidGuess,
  pickRandom,
} from "@/lib/wordle/selection";
import {
  MAX_ATTEMPTS,
  MAX_HINTS,
  type BoardState,
  type GameStatus,
  type WordleData,
  type WordleState,
} from "@/lib/wordle/types";

export type WordleAction =
  | { type: "SELECT_LENGTH"; length: number }
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

// Creates a fresh board. In "daily" mode the target comes from the rotation; in
// "practice" it is drawn at random, avoiding the word of the day.
export function createBoard(
  data: WordleData,
  length: number,
  day: number,
  mode: "daily" | "practice" = "daily",
): BoardState {
  const target =
    mode === "daily"
      ? dailyWord(data, length, day)
      : pickRandom(getGroup(data, length), dailyWord(data, length, day));
  return {
    target,
    length,
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

export function createInitialState(
  data: WordleData,
  defaultLength: number,
  day: number,
): WordleState {
  return {
    activeLength: defaultLength,
    boards: { [defaultLength]: createBoard(data, defaultLength, day) },
  };
}

// Immutability helper: replaces the board for one length without touching the others.
function withBoard(state: WordleState, b: BoardState): WordleState {
  return { ...state, boards: { ...state.boards, [b.length]: b } };
}

// Factory: the reducer closes over `data` + the day. It stays pure (deterministic
// given `data`/`day`) and testable, while keeping the random word draw
// hors des composants.
export function createWordleReducer(data: WordleData, day: number) {
  return function reducer(
    state: WordleState,
    action: WordleAction,
  ): WordleState {
    const board = state.boards[state.activeLength];

    switch (action.type) {
      case "SELECT_LENGTH": {
        // Creates the board on the tab's first visit; otherwise keeps its state.
        const boards = state.boards[action.length]
          ? state.boards
          : {
              ...state.boards,
              [action.length]: createBoard(data, action.length, day),
            };
        return { ...state, activeLength: action.length, boards };
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
        return withBoard(
          state,
          createBoard(data, board.length, day, "practice"),
        );
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
