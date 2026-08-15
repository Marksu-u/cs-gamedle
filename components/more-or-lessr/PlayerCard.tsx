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

  // Rating: 2 decimals. Prize: whole dollars.
  //
  // Both go through the locale rather than a fixed "en-US", so a French player
  // reads "1,12" and "1 500 000 $" instead of the American forms. The prize uses
  // `narrowSymbol`: the standard French rendering of USD is "$US", but the
  // French catalogue already writes the bare "$" and the scene is dollars only.
  function formatValue(p: Player): string {
    const v = statValue(p, category);
    return category === "rating"
      ? format.number(v, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
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
