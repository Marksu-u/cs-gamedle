import { isCorrectGuess } from "@/lib/more-or-lessr/compare";
import { dailySequence } from "@/lib/more-or-lessr/selection";
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
  | { type: "REPLAY" }
  | { type: "GIVE_UP" };

// État de départ : écran de sélection de catégorie (aucune date requise).
export function createInitialState(): GameState {
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
    status: "select",
  };
}

// Lance (ou relance) une catégorie : construit la séquence du jour et arme le 1er duel.
function startCategory(
  data: MorelessData,
  category: Category,
  today: string,
): GameState {
  const sequence = dailySequence(data, today, category);
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
    status: "playing",
  };
}

// Factory : reducer fermé sur `data` + la date du jour → pur et testable, tirage
// seedé hors des composants. `today` injecté (défaut = aujourd'hui) pour les tests.
export function createMorelessReducer(
  data: MorelessData,
  today: string = new Date().toISOString().slice(0, 10),
) {
  return function reducer(state: GameState, action: MorelessAction): GameState {
    switch (action.type) {
      case "START":
        return startCategory(data, action.category, today);

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
          score: state.score + (correct ? 1 : 0),
          status: "revealed",
        };
      }

      case "NEXT": {
        if (state.status !== "revealed") return state;
        if (state.round >= TOTAL_ROUNDS) {
          return { ...state, status: "finished" };
        }
        // Chaîne moreless : le challenger révélé devient TOUJOURS la prochaine
        // ancre (on ne choisit pas de la garder) → aucun joueur dominant ne reste.
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

      case "REPLAY":
        return state.category
          ? startCategory(data, state.category, today)
          : createInitialState();

      case "GIVE_UP": {
        // Abandon possible seulement en cours de partie (playing/revealed) : on
        // termine en conservant le score déjà acquis, la bannière de fin s'affiche.
        if (state.status !== "playing" && state.status !== "revealed")
          return state;
        return { ...state, status: "finished" };
      }

      default:
        return state;
    }
  };
}
