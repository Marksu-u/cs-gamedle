import type { GuessrData, Player } from "./types";

// Cible aléatoire, retirée à chaque nouvelle partie (pas de « joueur du jour »).
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
