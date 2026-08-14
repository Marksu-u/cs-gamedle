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

// État de départ : joueur du jour, partie en cours, aucune ligne.
export function createInitialState(data: GuessrData, day: number): GameState {
  return {
    target: dailyTarget(data, day),
    rows: [],
    status: "playing",
    mode: "daily",
    day,
  };
}

// Entraînement : cible aléatoire, hors rotation, ne rapporte aucun point.
function createPracticeState(data: GuessrData, day: number): GameState {
  return {
    target: randomTarget(data),
    rows: [],
    status: "playing",
    mode: "practice",
    day,
  };
}

// Factory : reducer fermé sur `data` + le jour → pur et testable.
export function createGuessrReducer(data: GuessrData, day: number) {
  return function reducer(state: GameState, action: GuessrAction): GameState {
    switch (action.type) {
      case "GUESS": {
        if (state.status !== "playing") return state;
        const guess = data.players.find(
          (p) => norm(p.name) === norm(action.name),
        );
        if (!guess) return state; // nom hors pool
        // Dédup uniquement sur les lignes guess (les indices ne bloquent pas).
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

      // Indice : révèle une colonne aléatoire encore cachée. Consomme un essai
      // (ajoute une ligne), plafonné à MAX_HINTS, jamais deux fois la même colonne.
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

      // Abandon : révèle la réponse (bannière), plus de saisie possible.
      case "GIVE_UP": {
        if (state.status !== "playing") return state;
        return { ...state, status: "gaveup" };
      }

      case "RESTORE":
        return action.state;

      // Entraînement : nouvelle cible aléatoire, grille vidée, aucun point.
      case "PRACTICE":
        return createPracticeState(data, day);

      default:
        return state;
    }
  };
}
