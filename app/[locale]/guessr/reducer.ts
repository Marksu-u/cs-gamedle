import { compareGuess, norm } from "@/lib/guessr/compare";
import { buildHintResult, HINT_FIELDS, MAX_HINTS } from "@/lib/guessr/hints";
import { dailyTarget, randomTarget } from "@/lib/guessr/selection";
import type { GameState, GridRow, GuessrData } from "@/lib/guessr/types";

export type GuessrAction =
  | { type: "GUESS"; name: string }
  | { type: "HINT" }
  | { type: "GIVE_UP" }
  | { type: "PRACTICE" }
  | { type: "RESTORE"; state: GameState };

// Starting state: player of the day, game in progress, no rows.
export function createInitialState(data: GuessrData, day: number): GameState {
  return {
    target: dailyTarget(data, day),
    rows: [],
    status: "playing",
    mode: "daily",
    day,
  };
}

// Practice: random target, outside the rotation, scores nothing.
function createPracticeState(data: GuessrData, day: number): GameState {
  return {
    target: randomTarget(data),
    rows: [],
    status: "playing",
    mode: "practice",
    day,
  };
}

// Factory: the reducer closes over `data` + the day → pure and testable.
export function createGuessrReducer(data: GuessrData, day: number) {
  return function reducer(state: GameState, action: GuessrAction): GameState {
    switch (action.type) {
      case "GUESS": {
        if (state.status !== "playing") return state;
        const guess = data.players.find(
          (p) => norm(p.name) === norm(action.name),
        );
        if (!guess) return state; // name not in the pool
        // Dedupe on guess rows only (hints do not block).
        const alreadyGuessed = state.rows.some(
          (r) =>
            r.kind === "guess" &&
            norm(r.result.player.name) === norm(guess.name),
        );
        if (alreadyGuessed) return state;
        const result = compareGuess(guess, state.target);
        return {
          ...state,
          rows: [{ kind: "guess", result }, ...state.rows],
          status: result.correct ? "won" : "playing",
        };
      }

      // Hint: reveals a random column still hidden. Costs a try (adds a row),
      // capped at MAX_HINTS, never the same column twice.
      case "HINT": {
        if (state.status !== "playing") return state;
        const used = state.rows.flatMap((r) =>
          r.kind === "hint" ? [r.field] : [],
        );
        if (used.length >= MAX_HINTS) return state;
        const available = HINT_FIELDS.filter((f) => !used.includes(f));
        const field = available[Math.floor(Math.random() * available.length)];
        const row: GridRow = {
          kind: "hint",
          field,
          result: buildHintResult(state.target, field),
        };
        return { ...state, rows: [row, ...state.rows] };
      }

      // Give up: reveals the answer (banner), no further input.
      case "GIVE_UP": {
        if (state.status !== "playing") return state;
        return { ...state, status: "gaveup" };
      }

      case "RESTORE":
        return action.state;

      // Practice: new random target, grid cleared, no points.
      case "PRACTICE":
        return createPracticeState(data, day);

      default:
        return state;
    }
  };
}
