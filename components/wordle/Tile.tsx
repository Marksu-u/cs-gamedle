import type { TileState } from "@/lib/wordle/types";

// Couleurs d'état dérivées des tokens du thème CS2 (cf. cs2-theme.css).
const STATE_CLASS: Record<TileState, string> = {
  empty: "border-[color:var(--border)] bg-transparent text-foreground",
  absent: "border-transparent bg-[var(--wordle-absent)] text-[color:var(--muted)]",
  present: "border-transparent bg-[var(--wordle-present)] text-black",
  correct: "border-transparent bg-[var(--wordle-correct)] text-black",
};

type Props = {
  letter: string;
  state: TileState;
  index: number; // colonne : sert au délai de flip en cascade (gauche→droite)
  revealed: boolean; // rangée soumise → flip ; sinon pop léger à la frappe
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
      // Le délai inline (longhand) surcharge le delay du shorthand `animation` posé
      // par Tailwind → effet cascade colonne par colonne.
      style={revealed ? { animationDelay: `${index * 0.25}s` } : undefined}
    >
      {letter}
    </div>
  );
}
