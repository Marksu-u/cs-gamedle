import { draw } from "@/lib/daily/deck";
import type { GuessrData, Player } from "./types";

// Random target, practice mode only: the player of the day comes from
// `dailyTarget` below.
// `rand` is injectable for tests (defaults to Math.random).
export function randomTarget(
  data: GuessrData,
  rand: () => number = Math.random,
): Player {
  if (data.players.length === 0) {
    throw new Error("Pool vide : aucun joueur dans guessr_players.json.");
  }
  const idx = Math.floor(rand() * data.players.length);
  return data.players[idx];
}

// Player of the day. `randomTarget` remains, but now serves practice only.
export function dailyTarget(data: GuessrData, day: number): Player {
  if (data.players.length === 0) {
    throw new Error("Pool vide : aucun joueur dans guessr_players.json.");
  }
  return draw(data.players, "guessr", day, 1)[0];
}
