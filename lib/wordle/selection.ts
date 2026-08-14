import type { WordleData } from "./types";

// Les clés du JSON sont des chaînes ("3".."8") ; on les convertit et trie en nombres.
export function availableLengths(data: WordleData): number[] {
  return Object.keys(data.words)
    .map(Number)
    .sort((a, b) => a - b);
}

export function getGroup(data: WordleData, length: number): string[] {
  return data.words[String(length)] ?? [];
}

// `exclude` évite de retomber sur le mot courant au "Rejouer". Garde-fou : si le
// filtre vide la liste (groupe à un seul mot), on retire l'exclusion.
export function pickRandom(group: string[], exclude?: string): string {
  const pool = exclude ? group.filter((w) => w !== exclude) : group;
  const source = pool.length > 0 ? pool : group;
  return source[Math.floor(Math.random() * source.length)];
}

export function isValidGuess(group: string[], guess: string): boolean {
  const set = new Set(group.map((w) => w.toUpperCase()));
  return set.has(guess.toUpperCase());
}
