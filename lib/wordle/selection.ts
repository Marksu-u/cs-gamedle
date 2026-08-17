import { draw } from "@/lib/daily/deck";
import type { WordleData } from "./types";

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

// Word of the day for a given length. Each length is an independent stream: six
// daily puzzles, six separate cycles.
export function dailyWord(
  data: WordleData,
  length: number,
  day: number,
): string {
  return draw(getGroup(data, length), `wordle-${length}`, day, 1)[0];
}
