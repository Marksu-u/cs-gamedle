import type { CSSProperties } from "react";
import GuessRow from "./GuessRow";
import { MAX_ATTEMPTS, type BoardState } from "@/lib/wordle/types";

export default function Board({ board, maxLength }: { board: BoardState; maxLength: number }) {
  // L'index de la rangée en cours = nombre d'essais déjà soumis.
  const currentRow = board.guesses.length;
  return (
    <div
      className="mx-auto grid w-fit gap-1.5"
      // Taille de tuile homogène quelle que soit la longueur : calée sur la longueur
      // max (pas sur la longueur courante) pour que la grille la plus large tienne à
      // l'écran. Plafonnée à 3.5rem sur grand écran, sinon réduite pour rester dans
      // le viewport. Toutes les tuiles (3→8 lettres) ont ainsi la même taille.
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
            letters={submitted ? board.guesses[r] : isCurrent ? board.current : ""}
            states={submitted ? board.evaluations[r] : []}
            revealed={submitted}
            shake={isCurrent && board.invalid}
          />
        );
      })}
    </div>
  );
}
