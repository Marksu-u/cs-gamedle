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

// Every tag in the dictionary, in a stable order: the daily draw needs ONE pool,
// not one per length. Sorting by length then alphabetically keeps the order a
// pure function of the data, so the same day serves the same tags for everyone
// whatever order the JSON happens to be in.
function allTags(data: WordleData): string[] {
  return availableLengths(data).flatMap((len) =>
    [...getGroup(data, len)].sort(),
  );
}

// The day's tags, one per slot. `draw` slices a single shuffled deck, so the
// five are distinct and a tag does not come back for `⌊pool/4⌋` draws.
//
// `exclude` is the day's Guessr answer. The two games draw on independent
// streams, so without this a tag can be today's Wordle target AND today's Guessr
// target — and solving the first hands over the second. One spare is drawn so
// dropping the collision still leaves a full day.
export function dailyTags(
  data: WordleData,
  day: number,
  exclude?: string,
): string[] {
  const pool = allTags(data);
  if (pool.length < SLOT_COUNT + 1) {
    throw new Error(
      `Dictionnaire insuffisant : ${pool.length} pseudos, ${SLOT_COUNT + 1} requis.`,
    );
  }
  const tire = draw(pool, "wordle", day, SLOT_COUNT + 1);
  const garde = exclude
    ? tire.filter((t) => t.toUpperCase() !== exclude.toUpperCase())
    : tire;
  return garde.slice(0, SLOT_COUNT);
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
  const evites = new Set(exclude.map((t) => t.toUpperCase()));
  const filtre = allTags(data).filter((t) => !evites.has(t.toUpperCase()));
  const pool = filtre.length >= SLOT_COUNT ? filtre : allTags(data);
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return pool.slice(0, SLOT_COUNT);
}
