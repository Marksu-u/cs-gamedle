import PointsLine from "@/components/daily/PointsLine";
import type { BoardState } from "@/lib/wordle/types";

type Props = {
  board: BoardState;
  points: number;
  onPractice: () => void;
};

export default function ResultBanner({ board, points, onPractice }: Props) {
  if (board.status === "playing") return null;
  const won = board.status === "won";
  const essais = board.guesses.length;
  const indices = board.hintedChars.length;
  const detail = won
    ? `trouvé en ${essais} essai${essais > 1 ? "s" : ""}, ${
        indices === 0
          ? "aucun indice"
          : `${indices} indice${indices > 1 ? "s" : ""}`
      }`
    : "grille perdue";

  return (
    <div className="flex flex-col items-center gap-2 text-center">
      <p
        className="cs2-display text-2xl font-extrabold uppercase italic"
        style={{ color: won ? "var(--wordle-correct)" : "var(--accent-hot)" }}
      >
        {won ? "Gagné !" : "Perdu"}
      </p>
      {!won && (
        <p className="text-sm text-[color:var(--muted)]">
          Le pseudo était{" "}
          <span className="text-foreground font-bold">{board.target}</span>
        </p>
      )}
      <PointsLine
        points={points}
        detail={detail}
        practice={board.mode === "practice"}
      />
      <button
        type="button"
        onClick={onPractice}
        className="mt-1 rounded-md bg-[var(--accent)] px-5 py-2 text-xs font-semibold tracking-widest text-black uppercase transition hover:bg-[var(--accent-hot)]"
      >
        {board.mode === "daily" ? "S'entraîner" : "Rejouer"}
      </button>
    </div>
  );
}
