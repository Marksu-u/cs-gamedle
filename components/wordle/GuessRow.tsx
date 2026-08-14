import Tile from "./Tile";
import type { TileState } from "@/lib/wordle/types";

type Props = {
  length: number;
  letters: string; // contenu de la rangée ("" si vide)
  states: TileState[]; // coloriage ([] = tout empty)
  revealed: boolean; // rangée déjà soumise
  shake: boolean; // essai invalide sur la rangée courante
};

export default function GuessRow({ length, letters, states, revealed, shake }: Props) {
  return (
    <div
      className={`grid gap-1.5 ${shake ? "animate-[wordle-shake_0.4s_ease]" : ""}`}
      style={{ gridTemplateColumns: `repeat(${length}, var(--tile-size))` }}
    >
      {Array.from({ length }).map((_, i) => (
        <Tile
          key={i}
          index={i}
          letter={letters[i] ?? ""}
          state={states[i] ?? "empty"}
          revealed={revealed}
        />
      ))}
    </div>
  );
}
