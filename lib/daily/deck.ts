import { hashSeed, mulberry32 } from "./rng";

// Tirage quotidien anti-répétition, commun aux neuf flux du projet.
//
// Modèle : une suite de paquets mélangés (une permutation complète par « époque »),
// découpés en créneaux d'exactement `count` cartes. Un tirage est TOUJOURS une
// tranche d'un seul paquet — il ne déborde jamais sur le suivant. C'est ce qui
// rend structurellement impossible le doublon à l'intérieur d'une même journée.
//
// Le seul endroit où une carte peut revenir trop tôt est la couture entre deux
// époques ; une fenêtre de refroidissement l'y interdit (cf. `applyCooldown`).

// Nombre de tirages complets que contient un paquet. Le reste (`n % count`) n'est
// pas servi pour cette époque ; l'époque suivante étant mélangée différemment,
// aucune carte n'est durablement écartée.
export function runsPerDeck(poolSize: number, count: number): number {
  return Math.floor(poolSize / count);
}

// Taille de la zone protégée à la couture : au moins un tirage entier, sinon un
// quart du pool. C'est ce nombre qui fixe l'écart minimal garanti entre deux
// occurrences d'une même carte.
export function cooldownSize(poolSize: number, count: number): number {
  return Math.max(count, Math.floor(poolSize / 4));
}

// Mélange brut d'une époque : Fisher-Yates seedé sur (flux, époque).
function buildDeck<T>(
  pool: readonly T[],
  streamId: string,
  epoch: number,
): T[] {
  const rand = mulberry32(hashSeed(`${streamId}-${epoch}`));
  const deck = [...pool];
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  return deck;
}

// Écarte de la tête du paquet les cartes servies en fin d'époque précédente.
//
// `hi` borne la zone où l'on va chercher un partenaire d'échange. Voir `deckFor`
// pour pourquoi cette borne est le point délicat de tout le module.
function applyCooldown<T>(
  deck: T[],
  recent: ReadonlySet<T>,
  cooldown: number,
  hi: number,
): void {
  for (let i = 0; i < Math.min(cooldown, deck.length); i++) {
    if (!recent.has(deck[i])) continue;
    for (let j = cooldown; j < hi; j++) {
      if (!recent.has(deck[j])) {
        [deck[i], deck[j]] = [deck[j], deck[i]];
        break;
      }
    }
  }
}

function deckFor<T>(
  pool: readonly T[],
  streamId: string,
  epoch: number,
  count: number,
): T[] {
  const deck = buildDeck(pool, streamId, epoch);
  if (epoch === 0) return deck;

  const n = pool.length;
  const cooldown = cooldownSize(n, count);
  // Dernières cartes RÉELLEMENT servies à l'époque précédente : le reste du
  // paquet (`n % count`) n'a jamais été montré au joueur.
  const usedEnd = runsPerDeck(n, count) * count;
  const previous = buildDeck(pool, streamId, epoch - 1);
  const recent = new Set(
    previous.slice(Math.max(0, usedEnd - cooldown), usedEnd),
  );

  // POINT DÉLICAT. `recent` est calculé sur le mélange BRUT de l'époque
  // précédente, pas sur son mélange réparé — sinon la récursion remonterait
  // jusqu'à l'époque 0. Ce raccourci n'est correct que si la réparation ne
  // touche pas la queue servie du paquet. D'où la zone médiane
  // [cooldown, usedEnd - cooldown), qui exclut la tête protégée ET cette queue.
  //
  // Quand elle est vide (More or Lessr : usedEnd = 22, cooldown = 11), on se
  // rabat sur le paquet entier : la garantie devient empirique au lieu d'être
  // prouvée. C'est acceptable là parce que 11 joueurs par jour sur un pool de 28
  // imposent de toute façon un recouvrement — cf. le test de recouvrement moyen.
  const median = usedEnd - cooldown;
  const hi = median > cooldown ? median : n;

  applyCooldown(deck, recent, cooldown, hi);
  return deck;
}

// Tirage du jour `day` pour le flux `streamId` : `count` éléments distincts.
export function draw<T>(
  pool: readonly T[],
  streamId: string,
  day: number,
  count: number,
): T[] {
  const n = pool.length;
  if (n < 4) {
    throw new Error(`Pool trop petit pour « ${streamId} » : ${n} (4 minimum).`);
  }
  if (count < 1 || count > n) {
    throw new Error(
      `count invalide pour « ${streamId} » : ${count} (pool de ${n}).`,
    );
  }

  const runs = runsPerDeck(n, count);
  const epoch = Math.floor(day / runs);
  const slot = day % runs;
  const deck = deckFor(pool, streamId, epoch, count);
  return deck.slice(slot * count, slot * count + count);
}
