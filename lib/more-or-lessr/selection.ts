import { hashSeed, mulberry32 } from "./rng";
import {
  TOTAL_ROUNDS,
  type Category,
  type MorelessData,
  type Player,
} from "./types";

// Séquence des joueurs du jour, déterministe : même (date, catégorie) → même
// ordre pour tout le monde. Fisher-Yates seedé sur une copie, puis on garde
// TOTAL_ROUNDS + 1 joueurs (ceux qui défilent pendant la partie).
export function dailySequence(
  data: MorelessData,
  date: string, // "YYYY-MM-DD"
  category: Category,
): Player[] {
  const need = TOTAL_ROUNDS + 1;
  if (data.players.length < need) {
    throw new Error(
      `Pool insuffisant : ${data.players.length} joueurs, ${need} requis.`,
    );
  }
  const rand = mulberry32(hashSeed(`${date}-${category}`));
  const pool = [...data.players];
  // Fisher-Yates : mélange en place avec le RNG seedé.
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return pool.slice(0, need);
}
