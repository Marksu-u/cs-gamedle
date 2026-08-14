import type { BoardState } from "@/lib/wordle/types";

type Props = {
  board: BoardState;
  onReplay: () => void;
};

export default function ResultBanner({ board, onReplay }: Props) {
  if (board.status === "playing") return null;
  const won = board.status === "won";
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
          Le pseudo était <span className="font-bold text-foreground">{board.target}</span>
        </p>
      )}
      <button
        type="button"
        onClick={onReplay}
        className="mt-1 rounded-md bg-[var(--accent)] px-5 py-2 text-xs font-semibold tracking-widest text-black uppercase transition hover:bg-[var(--accent-hot)]"
      >
        Rejouer
      </button>
    </div>
  );
}
