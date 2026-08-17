"use client";

import { useLocale, useTranslations } from "next-intl";
import { TOTAL_ROUNDS, type Category } from "@/lib/more-or-lessr/types";
import PointsLine from "@/components/daily/PointsLine";
import ShareButton from "@/components/daily/ShareButton";
import { buildMolShare, type ShareT } from "@/lib/share/format";
import { pageUrl } from "@/lib/seo";

type Props = {
  score: number;
  points: number;
  results: boolean[]; // one entry per round played, for the shared strip
  category: Category;
  day: number;
  practice?: boolean;
  onReplay: () => void;
  onChangeCategory: () => void;
};

export default function ResultBanner({
  score,
  points,
  results,
  category,
  day,
  practice,
  onReplay,
  onChangeCategory,
}: Props) {
  const t = useTranslations("moreOrLessr");
  const g = useTranslations("game");
  // Root translator: the share builders address the catalogue by full path.
  const root = useTranslations() as unknown as ShareT;
  const locale = useLocale();
  const perfect = score === TOTAL_ROUNDS;
  return (
    <div className="flex w-full max-w-xl flex-col items-center gap-4 rounded-xl border border-[color:var(--border)] bg-[var(--surface)] p-8 text-center">
      <p className="text-xs tracking-[0.25em] text-[color:var(--accent)] uppercase">
        {perfect ? t("perfect") : t("finished")}
      </p>
      <p className="cs2-display text-foreground text-5xl font-extrabold italic">
        {score}/{TOTAL_ROUNDS}
      </p>
      <PointsLine
        points={points}
        detail={t("detail", { score, total: 10 })}
        practice={practice}
      />
      <div className="mt-2 flex flex-wrap items-center justify-center gap-3">
        <button
          type="button"
          onClick={onReplay}
          className="rounded-lg bg-[var(--accent)] px-4 py-2 text-xs font-semibold tracking-widest text-[#0e0f12] uppercase"
        >
          {g("playAgain")}
        </button>
        <button
          type="button"
          onClick={onChangeCategory}
          className="rounded-lg border border-[color:var(--border)] px-4 py-2 text-xs font-semibold tracking-widest text-[color:var(--muted)] uppercase"
        >
          {t("changeCategory")}
        </button>
        {/* Practice draws its own sequence: nobody else played that run. */}
        {!practice && (
          <ShareButton
            card={buildMolShare(
              {
                day,
                category,
                results,
                url: pageUrl("/more-or-lessr", locale),
              },
              root,
            )}
          />
        )}
      </div>
    </div>
  );
}
