import Tile from "./Tile";
import type { TileState } from "@/lib/wordle/types";

type Props = {
  length: number;
  letters: string; // row contents ("" when empty)
  states: TileState[]; // coloriage ([] = tout empty)
  revealed: boolean; // row already submitted
  shake: boolean; // invalid guess on the current row
};

export default function GuessRow({
  length,
  letters,
  states,
  revealed,
  shake,
}: Props) {
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
