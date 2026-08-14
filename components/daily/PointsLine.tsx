type Props = {
  points: number;
  detail: string; // ex. « trouvé en 1 essai, aucun indice »
  practice?: boolean;
};

// Ligne de score affichée sous chaque bannière de résultat. En entraînement, on
// dit explicitement que rien n'est compté — sinon le joueur croit marquer.
export default function PointsLine({ points, detail, practice }: Props) {
  if (practice) {
    return (
      <p className="mt-2 text-xs tracking-[0.2em] text-[color:var(--muted)] uppercase">
        Entraînement — ne compte pas
      </p>
    );
  }
  return (
    <p className="mt-2 text-sm">
      <span className="cs2-display text-xl font-extrabold text-[color:var(--accent)] italic">
        {points} pts
      </span>
      <span className="ml-2 text-[color:var(--muted)]">{detail}</span>
    </p>
  );
}
