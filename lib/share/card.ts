// The shape of a shared result, before it is either text or a picture.
//
// Both renderers read this and nothing else: `cardToText` (format.ts) turns it
// into the emoji block that pastes into a plain text field, `renderCard`
// (image.ts) paints it onto a canvas. A new mode builds a card; neither
// renderer changes.
//
// The rule from format.ts holds here too — a card carries the SHAPE of the
// attempt and never its content. `Tone` has nowhere to put a letter or a name,
// and `label` only ever holds a mode name from the catalogue.

import type { Tone } from "./emoji";

export type CardRow = {
  // Set only in the day recap, where each row names the mode it reports.
  label?: string;
  cells: Tone[];
};

export type ShareCard = {
  title: string;
  detail: string;
  rows: CardRow[];
  url: string;
};
