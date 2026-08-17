export type CsMode = {
  id: "wordle" | "guessr" | "more-or-lessr";
  href: string;
  icon: "grid" | "guess" | "versus";
};

// Structure only. The label and description of each mode live in the message
// catalogues under `modes.<id>`, keyed by the ids below — keeping translatable
// text out of the code and in one place per language.
export const csModes: CsMode[] = [
  { id: "wordle", href: "/wordle", icon: "grid" },
  { id: "guessr", href: "/guessr", icon: "guess" },
  { id: "more-or-lessr", href: "/more-or-lessr", icon: "versus" },
];
