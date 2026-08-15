import { draw } from "@/lib/daily/deck";
import type { GuessrData, Player } from "./types";

// Cible aléatoire, réservée au mode entraînement : le joueur du jour, lui,
// vient de `dailyTarget` ci-dessous.
// `rand` est injectable pour les tests (défaut : Math.random).
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

// Joueur du jour. `randomTarget` reste, mais ne sert plus qu'au mode entraînement.
export function dailyTarget(data: GuessrData, day: number): Player {
  if (data.players.length === 0) {
    throw new Error("Pool vide : aucun joueur dans guessr_players.json.");
  }
  return draw(data.players, "guessr", day, 1)[0];
}
