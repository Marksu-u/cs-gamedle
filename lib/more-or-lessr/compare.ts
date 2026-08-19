import type { Category, Direction, Player } from "./types";

// The value being compared, per the active category.
export function statValue(player: Player, category: Category): number {
  return category === "tournaments"
    ? player.tournaments_won
    : player.prize_money;
}

// Is the challenger "more" or "less" than the anchor? The answer is right when
// the guessed direction matches. A tie counts as right either way.
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
