import { draw } from "@/lib/daily/deck";
import { SLOT_COUNT, type WordleData } from "./types";

// The JSON keys are strings ("3".."8"); we convert and sort them as numbers.
export function availableLengths(data: WordleData): number[] {
  return Object.keys(data.words)
    .map(Number)
    .sort((a, b) => a - b);
}

export function getGroup(data: WordleData, length: number): string[] {
  return data.words[String(length)] ?? [];
}

// `exclude` avoids landing on the current word again on "Play again". Guard: if
// the filter empties the list (a single-word group), the exclusion is dropped.
export function pickRandom(group: string[], exclude?: string): string {
  const pool = exclude ? group.filter((w) => w !== exclude) : group;
  const source = pool.length > 0 ? pool : group;
  return source[Math.floor(Math.random() * source.length)];
}

export function isValidGuess(group: string[], guess: string): boolean {
  const set = new Set(group.map((w) => w.toUpperCase()));
  return set.has(guess.toUpperCase());
}

// The SLOT_COUNT lengths served on a given day, shortest first.
//
// A rotating window over the available lengths rather than a `draw`: the choice
// is a plain cycle over six values with five always served, so the deck's
// anti-repeat machinery has nothing to protect — five of six would sit in the
// cooldown zone every single day and the repair would spend its time fighting
// itself. A window advances by one a day, which leaves each length out exactly
// once per cycle and is obviously uniform.
function lengthsForDay(data: WordleData, day: number): number[] {
  const lengths = availableLengths(data);
  if (lengths.length < SLOT_COUNT) {
    throw new Error(
      `Dictionnaire insuffisant : ${lengths.length} longueurs, ${SLOT_COUNT} requises.`,
    );
  }
  const debut = day % lengths.length;
  return Array.from(
    { length: SLOT_COUNT },
    (_, i) => lengths[(debut + i) % lengths.length],
  ).sort((a, b) => a - b);
}

// One tag from a length's bucket, on that length's own stream.
//
// `exclude` is the day's Guessr answer, which can only ever collide in the one
// bucket matching its length. On the days it does, the pair draw for that bucket
// supplies the replacement: `draw` guarantees its two entries are distinct, so
// at most one of them is the excluded tag. Every other bucket, and every other
// day, keeps the single draw and therefore its full cycle.
function tagForLength(
  data: WordleData,
  length: number,
  day: number,
  exclude?: string,
): string {
  const group = getGroup(data, length);
  const [tag] = draw(group, `wordle-${length}`, day, 1);
  if (!exclude || tag.toUpperCase() !== exclude.toUpperCase()) return tag;
  const paire = draw(group, `wordle-${length}`, day, 2);
  return paire[0].toUpperCase() === exclude.toUpperCase() ? paire[1] : paire[0];
}

// The day's tags, one per slot and one per length.
//
// Drawing from a single flattened pool put no constraint on length, so a day
// could serve five tags of the same size. Each length now has its own stream —
// the same shape the six length-keyed boards used before the slot refactor —
// which restores both the variety and the per-length anti-repeat cycle.
//
// `exclude` is the day's Guessr answer. The two games draw on independent
// streams, so without it a tag can be today's Wordle target AND today's Guessr
// target, and solving the first hands over the second.
export function dailyTags(
  data: WordleData,
  day: number,
  exclude?: string,
): string[] {
  return lengthsForDay(data, day).map((len) =>
    tagForLength(data, len, day, exclude),
  );
}

// PRACTICE tags: a plain random pick, outside the rotation and scoring nothing.
// Deliberately not through `draw` — see the same note in
// lib/more-or-lessr/selection.ts about the epoch chain's cost off the cache.
//
// `exclude` holds the tags already on screen, so "Play again" does not serve the
// same board back. The guard drops the exclusion rather than throwing if the
// dictionary is too small to honour it.
export function practiceTags(
  data: WordleData,
  exclude: string[] = [],
  rand: () => number = Math.random,
): string[] {
  const lengths = availableLengths(data);
  if (lengths.length < SLOT_COUNT) {
    throw new Error(
      `Dictionnaire insuffisant : ${lengths.length} longueurs, ${SLOT_COUNT} requises.`,
    );
  }
  // Practice picks its lengths at random rather than by the daily window, so
  // "Play again" can serve a spread the rotation would not have reached yet.
  const melange = [...lengths];
  for (let i = melange.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [melange[i], melange[j]] = [melange[j], melange[i]];
  }

  const evites = new Set(exclude.map((t) => t.toUpperCase()));
  return melange
    .slice(0, SLOT_COUNT)
    .sort((a, b) => a - b)
    .map((len) => {
      const group = getGroup(data, len);
      const libres = group.filter((t) => !evites.has(t.toUpperCase()));
      const source = libres.length > 0 ? libres : group;
      return source[Math.floor(rand() * source.length)];
    });
}
