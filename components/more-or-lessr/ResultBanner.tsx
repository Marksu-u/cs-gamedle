import { TOTAL_ROUNDS } from "@/lib/more-or-lessr/types";
import PointsLine from "@/components/daily/PointsLine";

type Props = {
  score: number;
  points: number;
  practice?: boolean;
  onReplay: () => void;
  onChangeCategory: () => void;
};

export default function ResultBanner({
  score,
  points,
  practice,
  onReplay,
  onChangeCategory,
}: Props) {
  const perfect = score === TOTAL_ROUNDS;
  return (
    <div className="flex w-full max-w-xl flex-col items-center gap-4 rounded-xl border border-[color:var(--border)] bg-[var(--surface)] p-8 text-center">
      <p className="text-xs tracking-[0.25em] text-[color:var(--accent)] uppercase">
        {perfect ? "Sans faute !" : "Terminé"}
      </p>
      <p className="cs2-display text-foreground text-5xl font-extrabold italic">
        {score}/{TOTAL_ROUNDS}
      </p>
      <PointsLine
        points={points}
        detail={`${score} bonne${score > 1 ? "s" : ""} réponse${score > 1 ? "s" : ""} sur 10`}
        practice={practice}
      />
      <div className="mt-2 flex gap-3">
        <button
          type="button"
          onClick={onReplay}
          className="rounded-lg bg-[var(--accent)] px-4 py-2 text-xs font-semibold tracking-widest text-[#0e0f12] uppercase"
        >
          Rejouer
        </button>
        <button
          type="button"
          onClick={onChangeCategory}
          className="rounded-lg border border-[color:var(--border)] px-4 py-2 text-xs font-semibold tracking-widest text-[color:var(--muted)] uppercase"
        >
          Changer de catégorie
        </button>
      </div>
    </div>
  );
}
