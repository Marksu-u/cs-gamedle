// The visual language of every shared result, in one place.
//
// ⬛ is the Wordle "absent" square and 🟥 is a missed PUZZLE in the day recap:
// two different meanings, so two different glyphs, on purpose.

import type { Match } from "@/lib/guessr/types";
import type { TileState } from "@/lib/wordle/types";

export const TILE: Record<TileState, string> = {
  correct: "🟩",
  present: "🟨",
  absent: "⬛",
  empty: "⬛", // never reached: an evaluated row has no empty tile
};

export const MATCH: Record<Match, string> = {
  exact: "🟩",
  partial: "🟨",
  miss: "⬛",
};

export const ROUND_RIGHT = "✅";
export const ROUND_WRONG = "❌";
export const ROUND_UNPLAYED = "⬜";

export const DAY_SOLVED = "🟩";
export const DAY_PARTIAL = "🟨";
export const DAY_MISSED = "🟥";
export const DAY_UNPLAYED = "⬜";
