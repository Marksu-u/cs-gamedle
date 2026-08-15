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

// Séquence d'ENTRAÎNEMENT : simple mélange aléatoire, hors rotation.
//
// Elle ne passe volontairement pas par `draw`. Le tirage quotidien remonte la
// chaîne des époques depuis l'origine pour garantir ses écarts ; à 11 joueurs
// par jour cela fait ~10 000 tours pour la journée courante, amortis par le
// cache. Un jour tiré au hasard rate le cache à chaque fois — l'entraînement
// gelait l'interface près d'une seconde à chaque clic sur « Rejouer ».
//
// L'entraînement ne rapporte rien et n'a pas à être identique d'un joueur à
// l'autre : aucune de ces garanties ne lui sert.
export function practiceSequence(
  data: MorelessData,
  rand: () => number = Math.random,
): Player[] {
  const need = TOTAL_ROUNDS + 1;
  if (data.players.length < need) {
    throw new Error(
      `Pool insuffisant : ${data.players.length} joueurs, ${need} requis.`,
    );
  }
  const pool = [...data.players];
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return pool.slice(0, need);
}
