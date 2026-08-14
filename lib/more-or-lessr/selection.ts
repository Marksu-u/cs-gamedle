import { draw } from "@/lib/daily/deck";
import {
  TOTAL_ROUNDS,
  type Category,
  type MorelessData,
  type Player,
} from "./types";

// Séquence des joueurs du jour, déterministe : même (jour, catégorie) → même
// ordre pour tout le monde. Le tirage anti-répétition vit dans lib/daily/deck :
// il garantit qu'une manche ne contient jamais deux fois le même joueur et que
// deux journées consécutives ne donnent jamais la même manche.
export function dailySequence(
  data: MorelessData,
  day: number,
  category: Category,
): Player[] {
  const need = TOTAL_ROUNDS + 1;
  if (data.players.length < need) {
    throw new Error(
      `Pool insuffisant : ${data.players.length} joueurs, ${need} requis.`,
    );
  }
  return draw(data.players, `mol-${category}`, day, need);
}
