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

// Écarte de la tête du paquet les cartes servies en fin d'époque précédente :
// chaque carte « récente » trouvée dans les `cooldown` premières positions est
// échangée avec la première carte non récente située au-delà.
//
// La réparation est au mieux : si la zone d'échange ne contient plus aucune carte
// non récente, la carte reste en place. Cela ne peut arriver que si `count`
// dépasse la moitié du pool — aucun flux du projet n'est dans ce cas.
function applyCooldown<T>(
  deck: T[],
  recent: ReadonlySet<T>,
  cooldown: number,
): void {
  for (let i = 0; i < Math.min(cooldown, deck.length); i++) {
    if (!recent.has(deck[i])) continue;
    for (let j = cooldown; j < deck.length; j++) {
      if (!recent.has(deck[j])) {
        [deck[i], deck[j]] = [deck[j], deck[i]];
        break;
      }
    }
  }
}

// Un paquet réparé est entièrement déterminé par (pool, flux, count, époque) :
// on le garde pour la session afin que la chaîne ci-dessous ne soit parcourue
// qu'une fois. Sans ce cache, chaque appel repaierait le chemin depuis l'époque 0.
//
// Le pool fait partie de la clé, via l'identité du tableau : deux pools distincts
// servis par le même flux ne doivent pas se partager un paquet. Un WeakMap évite
// d'avoir à hacher le contenu du pool à chaque appel, ce qui annulerait le cache.
const decks = new WeakMap<object, Map<string, readonly unknown[]>>();

function deckFor<T>(
  pool: readonly T[],
  streamId: string,
  epoch: number,
  count: number,
): T[] {
  let parPool = decks.get(pool);
  if (!parPool) {
    parPool = new Map();
    decks.set(pool, parPool);
  }
  const key = `${streamId}|${count}|${epoch}`;
  const cached = parPool.get(key);
  if (cached) return cached as T[];

  const n = pool.length;
  const cooldown = cooldownSize(n, count);
  // Cartes RÉELLEMENT servies par une époque : le reste (`n % count`) n'a jamais
  // été montré au joueur, il n'a donc pas à être protégé.
  const usedEnd = runsPerDeck(n, count) * count;

  // Chaîne itérative depuis l'époque 0. Le point important : `recent` est lu sur
  // le paquet RÉPARÉ de l'époque précédente, jamais sur son mélange brut.
  //
  // Un raccourci à profondeur 1 (lire le mélange brut) serait tentant, mais il
  // est faux dès que la réparation déplace des cartes dans la zone servie : les
  // cartes réellement servies la veille disparaissent alors de `recent` et
  // reviennent aussitôt. Mesuré sur More or Lessr, ce raccourci laissait 2,8
  // joueurs en commun d'un jour à l'autre au lieu de 0.
  //
  // Le coût est linéaire en `epoch`, payé une seule fois grâce au cache.
  let deck = buildDeck<T>(pool, streamId, 0);
  for (let e = 1; e <= epoch; e++) {
    const next = buildDeck<T>(pool, streamId, e);
    const recent = new Set(
      deck.slice(Math.max(0, usedEnd - cooldown), usedEnd),
    );
    applyCooldown(next, recent, cooldown);
    deck = next;
  }

  parPool.set(key, deck);
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
  if (!Number.isInteger(count) || count < 1 || count > n) {
    throw new Error(
      `count invalide pour « ${streamId} » : ${count} (pool de ${n}).`,
    );
  }
  // Un `day` négatif ou non entier produirait un `slot` négatif, donc une tranche
  // décalée ou vide — un tirage silencieusement faux plutôt qu'une erreur.
  if (!Number.isInteger(day) || day < 0) {
    throw new Error(`day invalide pour « ${streamId} » : ${day}.`);
  }

  const runs = runsPerDeck(n, count);
  const epoch = Math.floor(day / runs);
  const slot = day % runs;
  const deck = deckFor(pool, streamId, epoch, count);
  return deck.slice(slot * count, slot * count + count);
}
