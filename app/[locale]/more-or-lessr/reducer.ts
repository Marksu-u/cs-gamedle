import { isCorrectGuess } from "@/lib/more-or-lessr/compare";
import { dailySequence, practiceSequence } from "@/lib/more-or-lessr/selection";
import {
  TOTAL_ROUNDS,
  type Category,
  type Direction,
  type GameState,
  type MorelessData,
} from "@/lib/more-or-lessr/types";

export type MorelessAction =
  | { type: "START"; category: Category }
  | { type: "GUESS"; direction: Direction }
  | { type: "NEXT" }
  | { type: "PRACTICE" }
  | { type: "RESTORE"; state: GameState }
  | { type: "GIVE_UP" };

// Starting state: the category selection screen.
export function createInitialState(day: number): GameState {
  return {
    category: null,
    sequence: [],
    nextIndex: 0,
    anchor: null,
    challenger: null,
    round: 0,
    score: 0,
    lastGuess: null,
    lastCorrect: null,
    results: [],
    status: "select",
    mode: "daily",
    day,
  };
}

// Starts (or restarts) a category: builds the day's sequence and arms the first duel.
function startCategory(
  data: MorelessData,
  category: Category,
  day: number,
  mode: "daily" | "practice",
): GameState {
  const sequence =
    mode === "daily"
      ? dailySequence(data, day, category)
      : practiceSequence(data, category);
  return {
    category,
    sequence,
    nextIndex: 2,
    anchor: sequence[0],
    challenger: sequence[1],
    round: 1,
    score: 0,
    lastGuess: null,
    lastCorrect: null,
    results: [],
    status: "playing",
    mode,
    day,
  };
}

// Factory: the reducer closes over `data` + the day → pure and testable, with the
// seeded draw kept out of the components.
export function createMorelessReducer(data: MorelessData, day: number) {
  return function reducer(state: GameState, action: MorelessAction): GameState {
    switch (action.type) {
      case "START":
        return startCategory(data, action.category, day, "daily");

      // A run saved before per-round results existed restores without them.
      case "RESTORE":
        return { ...action.state, results: action.state.results ?? [] };

      case "GUESS": {
        if (state.status !== "playing" || !state.anchor || !state.challenger)
          return state;
        const correct = isCorrectGuess(
          state.anchor,
          state.challenger,
          state.category!,
          action.direction,
        );
        return {
          ...state,
          lastGuess: action.direction,
          lastCorrect: correct,
          results: [...state.results, correct],
          score: state.score + (correct ? 1 : 0),
          status: "revealed",
        };
      }

      case "NEXT": {
        if (state.status !== "revealed") return state;
        if (state.round >= TOTAL_ROUNDS) {
          return { ...state, status: "finished" };
        }
        // More-or-less chain: the revealed challenger ALWAYS becomes the next
        // anchor (there is no option to keep it) → no dominant player lingers.
        return {
          ...state,
          anchor: state.challenger,
          challenger: state.sequence[state.nextIndex],
          nextIndex: state.nextIndex + 1,
          round: state.round + 1,
          lastGuess: null,
          lastCorrect: null,
          status: "playing",
        };
      }

      case "PRACTICE":
        return state.category
          ? startCategory(data, state.category, day, "practice")
          : createInitialState(day);

      case "GIVE_UP": {
        // Giving up is only possible mid-run (playing/revealed): it
        // ends the run keeping the score already earned, and the end banner shows.
        if (state.status !== "playing" && state.status !== "revealed")
          return state;
        return { ...state, status: "finished" };
      }

      default:
        return state;
    }
  };
}
