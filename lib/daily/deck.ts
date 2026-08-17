import { hashSeed, mulberry32 } from "./rng";

// Anti-repeat daily draw, shared by the project's nine streams.
//
// Model: a run of shuffled decks (one full permutation per "epoch"), cut into
// slots of exactly `count` cards. A draw is ALWAYS a slice of a single deck —
// it never spills into the next one. That is what makes a duplicate inside one
// day structurally impossible.
//
// The only place a card can come back too early is the seam between two epochs;
// a cooldown window forbids it there (see `applyCooldown`).

// How many complete draws a deck holds. The remainder (`n % count`) is not
// served for that epoch; since the next epoch is shuffled differently, no card
// is permanently left out.
export function runsPerDeck(poolSize: number, count: number): number {
  return Math.floor(poolSize / count);
}

// Size of the protected zone at the seam: at least one whole draw, otherwise a
// quarter of the pool. This number sets the guaranteed minimum gap between two
// appearances of the same card.
export function cooldownSize(poolSize: number, count: number): number {
  return Math.max(count, Math.floor(poolSize / 4));
}

// Raw shuffle for one epoch: Fisher-Yates seeded on (stream, epoch).
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

// Pushes cards served at the end of the previous epoch out of the deck's head:
// every "recent" card found in the first `cooldown` positions is swapped with
// the first non-recent card beyond that zone.
//
// The repair is best-effort: if the swap zone holds no non-recent card left, the
// card stays put. That can only happen when `count` exceeds half the pool — no
// stream in this project does.
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

// A repaired deck is fully determined by (pool, stream, count, epoch), so it is
// kept for the session and the chain below is walked only once. Without this
// cache every call would replay the path from epoch 0.
//
// The pool is part of the key, by array identity: two distinct pools served by
// the same stream must not share a deck. A WeakMap avoids hashing the pool's
// contents on every call, which would defeat the cache.
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
  // Cards an epoch ACTUALLY serves: the remainder (`n % count`) was never shown
  // to the player, so it does not need protecting.
  const usedEnd = runsPerDeck(n, count) * count;

  // Iterative chain from epoch 0. The key point: `recent` is read from the
  // REPAIRED deck of the previous epoch, never from its raw shuffle.
  //
  // A depth-1 shortcut (reading the raw shuffle) is tempting but wrong as soon
  // as the repair moves cards inside the served zone: the cards actually served
  // yesterday then vanish from `recent` and come straight back. Measured on
  // More or Lessr, that shortcut left 2.8 players shared day to day instead of 0.
  //
  // The cost is linear in `epoch`, paid once thanks to the cache.
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

// Draw for day `day` on stream `streamId`: `count` distinct items.
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
  // A negative or non-integer `day` would produce a negative `slot`, hence a
  // shifted or empty slice — a silently wrong draw rather than an error.
  if (!Number.isInteger(day) || day < 0) {
    throw new Error(`day invalide pour « ${streamId} » : ${day}.`);
  }

  const runs = runsPerDeck(n, count);
  const epoch = Math.floor(day / runs);
  const slot = day % runs;
  const deck = deckFor(pool, streamId, epoch, count);
  return deck.slice(slot * count, slot * count + count);
}
