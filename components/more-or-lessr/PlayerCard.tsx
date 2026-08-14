import { statValue } from "@/lib/more-or-lessr/compare";
import { nationToFlag } from "@/lib/more-or-lessr/flags";
import type { Category, Player } from "@/lib/more-or-lessr/types";

type Props = {
  player: Player;
  category: Category;
  revealed: boolean; // affiche la valeur seulement si vrai
  state?: "idle" | "correct" | "wrong"; // flash de feedback après révélation
  onPick?: () => void; // absent → carte non cliquable (désactivée)
};

// Rating : 2 décimales. Prize : $ avec séparateurs de milliers.
function formatValue(player: Player, category: Category): string {
  const v = statValue(player, category);
  return category === "rating" ? v.toFixed(2) : "$" + v.toLocaleString("en-US");
}

// On répond en CLIQUANT la carte qu'on pense la plus grande (cf. ChainBoard).
export default function PlayerCard({
  player,
  category,
  revealed,
  state = "idle",
  onPick,
}: Props) {
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
        {revealed ? formatValue(player, category) : "?"}
      </span>
    </button>
  );
}
