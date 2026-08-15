"use client";

import { useTranslations } from "next-intl";
import PlayerCard from "@/components/more-or-lessr/PlayerCard";
import {
  TOTAL_ROUNDS,
  type Category,
  type Direction,
  type Player,
} from "@/lib/more-or-lessr/types";

type Props = {
  anchor: Player; // reference value, always visible
  challenger: Player; // hidden value to guess
  category: Category;
  round: number;
  score: number;
  revealed: boolean; // round played: the challenger's value is shown
  lastGuess: Direction | null;
  lastCorrect: boolean | null;
  onGuess: (direction: Direction) => void;
};

export default function ChainBoard({
  anchor,
  challenger,
  category,
  round,
  score,
  revealed,
  lastGuess,
  lastCorrect,
  onGuess,
}: Props) {
  const t = useTranslations("moreOrLessr");
  // Literal keys either side of the branch, never a template: a key built from a
  // variable renders as its own raw path when it misses, and only a render test
  // sees it. The two sentences are separate messages rather than one with the
  // stat name interpolated, so each language can agree the adjective with the
  // noun it actually carries.
  const label = category === "rating" ? t("peakRating") : t("prizeMoney");
  const instruction =
    category === "rating" ? "pickHigherRating" : "pickHigherPrize";

  // The green/red flash applies to the clicked card. Which one is recovered from
  // the direction: "more" = the challenger was clicked, "less" = the anchor.
  function cardState(
    which: "anchor" | "challenger",
  ): "idle" | "correct" | "wrong" {
    if (!revealed || lastGuess === null) return "idle";
    const picked = lastGuess === "more" ? "challenger" : "anchor";
    if (which !== picked) return "idle";
    return lastCorrect ? "correct" : "wrong";
  }

  return (
    <div className="flex w-full max-w-xl flex-col items-center gap-5">
      <div className="flex w-full items-center justify-between text-xs tracking-widest text-[color:var(--muted)] uppercase">
        <span>{t("round", { round, total: TOTAL_ROUNDS })}</span>
        <span className="text-[color:var(--accent)]">{label}</span>
        <span>{t("score", { score })}</span>
      </div>

      <p className="text-center text-sm text-[color:var(--muted)]">
        {/* Rich text rather than concatenation: the stat name stays highlighted
            without the component having to know where it sits in the sentence. */}
        {t.rich(instruction, {
          stat: (chunks) => <span className="text-foreground">{chunks}</span>,
        })}
      </p>

      <div className="flex w-full items-stretch gap-3">
        {/* Ancre : valeur visible. La cliquer = parier que le challenger a MOINS. */}
        <PlayerCard
          player={anchor}
          category={category}
          revealed
          state={cardState("anchor")}
          onPick={revealed ? undefined : () => onGuess("less")}
        />
        <span className="cs2-display self-center text-xl font-extrabold text-[color:var(--accent-hot)] italic">
          VS
        </span>
        {/* Challenger: hidden. Clicking it = betting it is MORE than the anchor.
            key sur le pseudo : rejoue l'animation d'entrée à chaque challenger. */}
        <div
          key={challenger.name}
          className="flex flex-1 animate-[mol-slide-in_0.25s_ease]"
        >
          <PlayerCard
            player={challenger}
            category={category}
            revealed={revealed}
            state={cardState("challenger")}
            onPick={revealed ? undefined : () => onGuess("more")}
          />
        </div>
      </div>
    </div>
  );
}
