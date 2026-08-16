"use client";

import { useFormatter } from "next-intl";
import { statValue } from "@/lib/more-or-lessr/compare";
import { nationToFlag } from "@/lib/more-or-lessr/flags";
import type { Category, Player } from "@/lib/more-or-lessr/types";

type Props = {
  player: Player;
  category: Category;
  revealed: boolean; // affiche la valeur seulement si vrai
  state?: "idle" | "correct" | "wrong"; // feedback flash after the reveal
  onPick?: () => void; // absent → card not clickable (disabled)
};

// You answer by CLICKING the card you think is bigger (see ChainBoard).
export default function PlayerCard({
  player,
  category,
  revealed,
  state = "idle",
  onPick,
}: Props) {
  const format = useFormatter();

  // Prize: whole dollars, formatted in the player's locale, so a French player
  // reads "1 500 000 $" rather than the American form. `narrowSymbol` gives the
  // bare "$": the standard French rendering of USD is "$US", but the French
  // catalogue already writes "$" and the scene deals in dollars only.
  //
  // The rating deliberately does NOT follow the locale. HLTV writes it "1.12"
  // everywhere, and the scene reads it as a published figure rather than as a
  // quantity to be re-punctuated — "1,05" would look wrong to a French player
  // who knows the site.
  function formatValue(p: Player): string {
    const v = statValue(p, category);
    return category === "rating"
      ? v.toFixed(2)
      : format.number(v, {
          style: "currency",
          currency: "USD",
          currencyDisplay: "narrowSymbol",
          maximumFractionDigits: 0,
        });
  }

  const ring =
    state === "correct"
      ? "border-[color:var(--wordle-correct)]"
      : state === "wrong"
        ? "border-[color:var(--accent-hot)]"
        : "border-[color:var(--border)] enabled:hover:border-[color:var(--accent)]";

  return (
    <button
      type="button"
      onClick={onPick}
      disabled={!onPick}
      className={`flex flex-1 flex-col items-center justify-center gap-2 rounded-xl border bg-[var(--surface)] p-6 text-center transition disabled:cursor-default ${ring}`}
    >
      <span className="text-3xl">{nationToFlag(player.nationality)}</span>
      <span className="cs2-display text-foreground text-2xl font-extrabold uppercase italic">
        {player.name}
      </span>
      <span className="text-xs tracking-widest text-[color:var(--muted)] uppercase">
        {player.team}
      </span>
      <span
        className="mt-1 min-h-7 text-xl font-bold text-[color:var(--accent)]"
        aria-live="polite"
      >
        {revealed ? formatValue(player) : "?"}
      </span>
    </button>
  );
}
