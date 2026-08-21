import type { CSSProperties } from "react";
import GuessRow from "./GuessRow";
import { MAX_ATTEMPTS, type BoardState } from "@/lib/wordle/types";

export default function Board({
  board,
  maxLength,
}: {
  board: BoardState;
  maxLength: number;
}) {
  // The current row index = number of guesses already submitted.
  const currentRow = board.guesses.length;
  return (
    <div
      className="mx-auto grid w-fit gap-1.5"
      // Uniform tile size whatever the length: keyed to the MAX length (not the
      // current one) so the widest grid still fits on screen. Capped at 3.5rem on
      // large screens, shrunk otherwise to stay in the viewport. Every tile (3→8
      // letters) therefore ends up the same size.
      //
      // 2.5rem = the page gutter (px-4, so 2rem) plus 0.5rem slack. There is no
      // panel around the board; put padding back and this has to grow with it.
      style={
        {
          "--tile-size": `min(3.5rem, calc((100vw - 2.5rem - ${maxLength - 1} * 0.375rem) / ${maxLength}))`,
        } as CSSProperties
      }
    >
      {Array.from({ length: MAX_ATTEMPTS }).map((_, r) => {
        const submitted = r < currentRow;
        const isCurrent = r === currentRow && board.status === "playing";
        return (
          <GuessRow
            key={r}
            length={board.length}
            letters={
              submitted ? board.guesses[r] : isCurrent ? board.current : ""
            }
            states={submitted ? board.evaluations[r] : []}
            revealed={submitted}
            shake={isCurrent && board.invalid}
          />
        );
      })}
    </div>
  );
}
