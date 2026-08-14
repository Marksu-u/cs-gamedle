import { nationToFlag } from "@/lib/more-or-lessr/flags";
import PointsLine from "@/components/daily/PointsLine";
import type { Player } from "@/lib/guessr/types";

type Props = {
  target: Player;
  attempts: number;
  points: number;
  hints: number;
  practice?: boolean;
  onPractice: () => void;
  gaveUp?: boolean; // variante abandon : révèle la réponse en rouge
};

export default function ResultBanner({
  target,
  attempts,
  points,
  hints,
  practice,
  onPractice,
  gaveUp,
}: Props) {
  return (
    <div
      className={`mt-6 w-full max-w-md rounded-xl border p-5 text-center ${
        gaveUp
          ? "border-red-500/40 bg-red-600/10"
          : "border-emerald-500/40 bg-emerald-600/10"
      }`}
    >
      <p
        className={`text-xs tracking-[0.2em] uppercase ${
          gaveUp ? "text-red-400" : "text-emerald-400"
        }`}
      >
        {gaveUp
          ? "Abandonné — la réponse était"
          : `Trouvé en ${attempts} essai${attempts > 1 ? "s" : ""}`}
      </p>
      <h2 className="cs2-display mt-1 text-3xl font-extrabold uppercase italic">
        {nationToFlag(target.nationality)} {target.name}
      </h2>
      <p className="mt-1 text-sm text-[color:var(--muted)]">
        {target.current_team} · {target.role.join(" / ")}
      </p>
      {target.achievements.length > 0 && (
        <ul className="mt-3 space-y-1 text-sm">
          {target.achievements.map((a) => (
            <li key={a}>🏆 {a}</li>
          ))}
        </ul>
      )}
      <PointsLine
        points={points}
        detail={
          gaveUp
            ? "abandonné"
            : `trouvé en ${attempts} essai${attempts > 1 ? "s" : ""}, ${
                hints === 0
                  ? "aucun indice"
                  : `${hints} indice${hints > 1 ? "s" : ""}`
              }`
        }
        practice={practice}
      />
      <button
        type="button"
        onClick={onPractice}
        className="mt-4 rounded-lg border border-white/15 bg-white/5 px-4 py-2 text-xs font-semibold tracking-widest uppercase hover:bg-white/10"
      >
        {practice ? "Rejouer" : "S'entraîner"}
      </button>
    </div>
  );
}
