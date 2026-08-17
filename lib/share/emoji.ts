// The visual language of every shared result, in one place.
//
// A tone is what a cell MEANS, not what it looks like. The text share renders
// tones as emoji (below), the image share paints them as coloured tiles
// (image.ts), and neither knows the other exists — so a mode added to one is
// never missing from the other.
//
// `absent` (a wrong letter) and `missed` (a failed PUZZLE in the day recap) are
// two tones on purpose: both mean "not it", at two different scales, and the
// day recap would read as a Wordle row if they shared a glyph.

import type { Match } from "@/lib/guessr/types";
import type { TileState } from "@/lib/wordle/types";

export type Tone =
  | "correct"
  | "present"
  | "absent"
  | "missed"
  | "right"
  | "wrong"
  | "blank";

export const EMOJI: Record<Tone, string> = {
  correct: "🟩",
  present: "🟨",
  absent: "⬛",
  missed: "🟥",
  right: "✅",
  wrong: "❌",
  blank: "⬜",
};

export const TILE: Record<TileState, Tone> = {
  correct: "correct",
  present: "present",
  absent: "absent",
  empty: "absent", // never reached: an evaluated row has no empty tile
};

export const MATCH: Record<Match, Tone> = {
  exact: "correct",
  partial: "present",
  miss: "absent",
};

export const ROUND_RIGHT: Tone = "right";
export const ROUND_WRONG: Tone = "wrong";
export const ROUND_UNPLAYED: Tone = "blank";

export const DAY_SOLVED: Tone = "correct";
export const DAY_PARTIAL: Tone = "present";
export const DAY_MISSED: Tone = "missed";
export const DAY_UNPLAYED: Tone = "blank";
