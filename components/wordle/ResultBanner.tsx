"use client";

import { useLocale, useTranslations } from "next-intl";
import PointsLine from "@/components/daily/PointsLine";
import ShareButton from "@/components/daily/ShareButton";
import { buildWordleShare, type ShareT } from "@/lib/share/format";
import { pageUrl } from "@/lib/seo";
import type { BoardState } from "@/lib/wordle/types";

type Props = {
  board: BoardState;
  points: number;
  onPractice: () => void;
};

export default function ResultBanner({ board, points, onPractice }: Props) {
  const t = useTranslations("wordle");
  const g = useTranslations("game");
  // Root translator: the share builders address the catalogue by full path.
  const root = useTranslations() as unknown as ShareT;
  const locale = useLocale();
  if (board.status === "playing") return null;
  const won = board.status === "won";
  const essais = board.guesses.length;
  const indices = board.hintedChars.length;
  // Pluralisation and the "no hints" case are handled by ICU in the catalogue,
  // because the rules differ per language and do not belong in a component.
  const detail = won
    ? t("detailWon", { attempts: essais, hints: indices })
    : t("detailLost");

  return (
    <div className="flex flex-col items-center gap-2 text-center">
      <p
        className="cs2-display text-2xl font-extrabold uppercase italic"
        style={{ color: won ? "var(--wordle-correct)" : "var(--accent-hot)" }}
      >
        {won ? t("solved") : t("missed")}
      </p>
      {!won && (
        <p className="text-sm text-[color:var(--muted)]">
          {t("answerWas")}{" "}
          <span className="text-foreground font-bold">{board.target}</span>
        </p>
      )}
      <PointsLine
        points={points}
        detail={detail}
        practice={board.mode === "practice"}
      />
      <div className="mt-1 flex flex-wrap items-center justify-center gap-3">
        <button
          type="button"
          onClick={onPractice}
          className="rounded-md bg-[var(--accent)] px-5 py-2 text-xs font-semibold tracking-widest text-black uppercase transition hover:bg-[var(--accent-hot)]"
        >
          {board.mode === "daily" ? g("practice") : g("playAgain")}
        </button>
        {/* Practice scores nothing and nobody else played that board: there is
            nothing to compare, so nothing to share. */}
        {board.mode === "daily" && (
          <ShareButton
            text={buildWordleShare(
              {
                length: board.length,
                day: board.day,
                evaluations: board.evaluations,
                won,
                attempts: essais,
                hints: indices,
                url: pageUrl("/wordle", locale),
              },
              root,
            )}
          />
        )}
      </div>
    </div>
  );
}
