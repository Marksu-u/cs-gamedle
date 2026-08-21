"use client";

import { useLocale, useTranslations } from "next-intl";
import { nationToFlag } from "@/lib/more-or-lessr/flags";
import PointsLine from "@/components/daily/PointsLine";
import ShareButton from "@/components/daily/ShareButton";
import { buildGuessrShare, type ShareT } from "@/lib/share/format";
import { pageUrl } from "@/lib/seo";
import type { GridRow, Player } from "@/lib/guessr/types";

type Props = {
  target: Player;
  attempts: number;
  points: number;
  hints: number;
  rows: GridRow[]; // for the shared grid; the names inside never leave this file
  day: number;
  practice?: boolean;
  onPractice: () => void;
  gaveUp?: boolean; // give-up variant: reveals the answer in red
};

export default function ResultBanner({
  target,
  attempts,
  points,
  hints,
  rows,
  day,
  practice,
  onPractice,
  gaveUp,
}: Props) {
  const t = useTranslations("guessr");
  const g = useTranslations("game");
  // Root translator: the share builders address the catalogue by full path.
  const root = useTranslations() as unknown as ShareT;
  const locale = useLocale();

  return (
    <div
      className={`mt-6 w-full max-w-md rounded-xl border p-5 text-center ${
        gaveUp
          ? "border-[color:var(--guessr-lost-border)] bg-[var(--guessr-lost)]"
          : "border-[color:var(--guessr-won-border)] bg-[var(--guessr-won)]"
      }`}
    >
      <p
        className={`text-xs tracking-[0.2em] uppercase ${
          gaveUp ? "text-red-400" : "text-emerald-400"
        }`}
      >
        {gaveUp ? t("gaveUp") : t("foundIn", { attempts })}
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
        detail={gaveUp ? t("detailGaveUp") : t("detail", { attempts, hints })}
        practice={practice}
      />
      <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
        <button
          type="button"
          onClick={onPractice}
          className="rounded-lg border border-white/15 bg-white/5 px-4 py-2 text-xs font-semibold tracking-widest uppercase hover:bg-white/10"
        >
          {practice ? g("playAgain") : g("practice")}
        </button>
        {/* Practice draws a random target nobody else played: nothing to compare. */}
        {!practice && (
          <ShareButton
            card={buildGuessrShare(
              { day, rows, won: !gaveUp, url: pageUrl("/guessr", locale) },
              root,
            )}
          />
        )}
      </div>
    </div>
  );
}
