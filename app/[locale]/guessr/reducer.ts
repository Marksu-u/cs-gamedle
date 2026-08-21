import { compareGuess, norm } from "@/lib/guessr/compare";
import { buildHintResult, HINT_FIELDS, MAX_HINTS } from "@/lib/guessr/hints";
import { dailyTarget, randomTarget } from "@/lib/guessr/selection";
import type {
  GameState,
  GridRow,
  GuessrData,
  HintField,
} from "@/lib/guessr/types";

export type GuessrAction =
  | { type: "GUESS"; name: string }
  | { type: "HINT" }
  | { type: "GIVE_UP" }
  | { type: "PRACTICE" }
  | { type: "RESTORE"; state: GameState };

// Columns a hint could still usefully reveal.
//
// Two ways a column stops being worth a try: it has already been hinted, or a
// guess turned it green. The second was missing, so a grid showing "3 majors"
// in green could be followed by a hint announcing "3 majors" — a try spent to
// learn nothing.
//
// Only an EXACT match disqualifies a column. A ▲/▼ arrow bounds a number
// without giving it, and an amber set overlap says "one of these" rather than
// "these" — both leave something real for a hint to reveal.
export function hintCandidates(state: GameState): HintField[] {
  const hinted = new Set(
    state.rows.flatMap((r) => (r.kind === "hint" ? [r.field] : [])),
  );
  const revealed = new Set<HintField>();
  for (const row of state.rows) {
    if (row.kind !== "guess") continue;
    for (const f of HINT_FIELDS) {
      if (row.result[f].match === "exact") revealed.add(f);
    }
  }
  return HINT_FIELDS.filter((f) => !hinted.has(f) && !revealed.has(f));
}

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
        const available = hintCandidates(state);
        // Nothing left worth revealing: return the SAME state rather than push a
        // row with an undefined field, which rendered as an empty grid line.
        if (available.length === 0) return state;
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
