"use client";

import { useTranslations } from "next-intl";

type Props = {
  points: number;
  detail: string; // ex. « trouvé en 1 essai, aucun indice »
  practice?: boolean;
};

// Ligne de score affichée sous chaque bannière de résultat. En entraînement, on
// dit explicitement que rien n'est compté — sinon le joueur croit marquer.
export default function PointsLine({ points, detail, practice }: Props) {
  const t = useTranslations("game");
  if (practice) {
    return (
      <p className="mt-2 text-xs tracking-[0.2em] text-[color:var(--muted)] uppercase">
        {t("practiceNotCounted")}
      </p>
    );
  }
  return (
    <p className="mt-2 text-sm">
      <span className="cs2-display text-xl font-extrabold text-[color:var(--accent)] italic">
        {t("points", { points })}
      </span>
      <span className="ml-2 text-[color:var(--muted)]">{detail}</span>
    </p>
  );
}
