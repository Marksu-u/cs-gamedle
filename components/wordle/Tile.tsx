import type { TileState } from "@/lib/wordle/types";

// State colours derived from the CS2 theme tokens (see cs2-theme.css).
const STATE_CLASS: Record<TileState, string> = {
  // Filled, not transparent. An empty tile is still a block and has to read as
  // one; left transparent the page gradient came through the board and the grid
  // looked like holes punched in the page rather than slots waiting for a letter.
  empty: "border-[color:var(--border)] bg-[var(--surface)] text-foreground",
  absent:
    "border-transparent bg-[var(--wordle-absent)] text-[color:var(--muted)]",
  present: "border-transparent bg-[var(--wordle-present)] text-black",
  correct: "border-transparent bg-[var(--wordle-correct)] text-black",
};

type Props = {
  letter: string;
  state: TileState;
  index: number; // column: drives the cascading flip delay (left→right)
  revealed: boolean; // submitted row → flip; otherwise a light pop on keypress
};

export default function Tile({ letter, state, index, revealed }: Props) {
  const animation = revealed
    ? "animate-[wordle-flip_0.5s_ease_forwards]"
    : letter
      ? "animate-[wordle-pop_0.1s_ease]"
      : "";
  return (
    <div
      className={`flex h-[var(--tile-size)] w-[var(--tile-size)] items-center justify-center rounded-md border-2 font-bold uppercase text-[calc(var(--tile-size)*0.45)] ${STATE_CLASS[state]} ${animation}`}
      // The inline (longhand) delay overrides the delay of the `animation` shorthand set
      // par Tailwind → effet cascade colonne par colonne.
      style={revealed ? { animationDelay: `${index * 0.25}s` } : undefined}
    >
      {letter}
    </div>
  );
}
