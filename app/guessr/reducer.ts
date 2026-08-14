import { compareGuess, norm } from "@/lib/guessr/compare";
import { buildHintResult, HINT_FIELDS, MAX_HINTS } from "@/lib/guessr/hints";
import { randomTarget } from "@/lib/guessr/selection";
import type { GameState, GridRow, GuessrData } from "@/lib/guessr/types";

export type GuessrAction =
  | { type: "GUESS"; name: string }
  | { type: "HINT" }
  | { type: "GIVE_UP" }
  | { type: "REPLAY" };

// État de départ : cible aléatoire, partie en cours, aucune ligne.
export function createInitialState(data: GuessrData): GameState {
  return { target: randomTarget(data), rows: [], status: "playing" };
}

// Factory : reducer fermé sur `data` → pur et testable.
export function createGuessrReducer(data: GuessrData) {
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

      // Nouvelle partie : nouvelle cible aléatoire, grille vidée.
      case "REPLAY":
        return createInitialState(data);

      default:
        return state;
    }
  };
}
