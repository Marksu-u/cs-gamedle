import type { Category, Direction, Player } from "./types";

// Valeur comparée selon la catégorie active.
export function statValue(player: Player, category: Category): number {
  return category === "rating" ? player.peak_rating : player.prize_money;
}

// Le challenger est-il « plus » ou « moins » que l'ancre ? La réponse est juste
// si la direction devinée correspond. L'égalité compte juste dans les deux sens.
export function isCorrectGuess(
  anchor: Player,
  challenger: Player,
  category: Category,
  direction: Direction,
): boolean {
  const a = statValue(anchor, category);
  const c = statValue(challenger, category);
  return direction === "more" ? c >= a : c <= a;
}
