"use client";

import { useLocale, useTranslations } from "next-intl";
import ShareButton from "@/components/daily/ShareButton";
import { streakMultiplier } from "@/lib/daily/scoring";
import { useDailyState, useHydrated } from "@/lib/daily/store";
import { useDay } from "@/lib/daily/useDailyPuzzle";
import { buildDayShare, type ShareT } from "@/lib/share/format";
import { pageUrl } from "@/lib/seo";

// Recap of the nine puzzles, next to the score strip that feeds it.
//
// Rendered at all times and merely disabled until there is something to share:
// the store is empty on the server and on the first client render, so a button
// that appeared only once hydration landed would shift the page under the
// player's cursor.
export default function DayShare() {
  // Root translator: the share builders address the catalogue by full path.
  const root = useTranslations() as unknown as ShareT;
  const locale = useLocale();
  const { meta, progress } = useDailyState();
  const hydrated = useHydrated();
  const day = useDay();

  const puzzles = progress?.day === day ? progress.puzzles : {};
  const played = Object.values(puzzles).some(
    (p) => p !== undefined && p.status !== "playing",
  );

  const card = buildDayShare(
    {
      day,
      runScore: meta.runScore,
      streak: meta.streak,
      multiplier: streakMultiplier(meta.streak),
      puzzles,
      url: pageUrl("/", locale),
    },
    root,
  );

  return (
    <div className="-mt-2 mb-6 flex justify-center">
      <ShareButton card={card} disabled={!hydrated || !played} />
    </div>
  );
}
