import type { KeyState, TileState } from "./types";

// TWO-pass Wordle algorithm. Essential for duplicates: we mark
// all the "correct" ones first and count down the target's remaining
// occurrences, otherwise a doubled guessed character would be marked "present"
// too many times.
export function evaluateGuess(guess: string, target: string): TileState[] {
  const g = guess.toUpperCase();
  const t = target.toUpperCase();
  const states: TileState[] = new Array(g.length).fill("absent");

  // Count of target characters still "available" to be marked present.
  const remaining: Record<string, number> = {};
  for (const ch of t) remaining[ch] = (remaining[ch] ?? 0) + 1;

  // Passe 1 — "correct" : bonne lettre, bonne place. On consomme l'occurrence.
  for (let i = 0; i < g.length; i++) {
    if (g[i] === t[i]) {
      states[i] = "correct";
      remaining[g[i]]--;
    }
  }

  // Pass 2 — "present": while an occurrence remains to consume, otherwise absent.
  for (let i = 0; i < g.length; i++) {
    if (states[i] === "correct") continue;
    const ch = g[i];
    if (remaining[ch] > 0) {
      states[i] = "present";
      remaining[ch]--;
    }
  }

  return states;
}

// State priority for colouring the keyboard: a character keeps the best state it
// has reached (an "absent" must never overwrite a "correct" already earned).
const RANK: Record<KeyState, number> = {
  unused: 0,
  absent: 1,
  present: 2,
  correct: 3,
};

export function deriveKeyStates(
  guesses: string[],
  evaluations: TileState[][],
  hintedChars: string[] = [],
): Map<string, KeyState> {
  const map = new Map<string, KeyState>();
  for (let r = 0; r < guesses.length; r++) {
    const g = guesses[r].toUpperCase();
    const states = evaluations[r];
    for (let i = 0; i < g.length; i++) {
      const s = states[i];
      if (s === "empty") continue; // safety: submitted guesses contain no empty
      const cur = map.get(g[i]) ?? "unused";
      if (RANK[s] > RANK[cur]) map.set(g[i], s);
    }
  }
  // Hints: a hinted character shows as "present" on the keyboard, without ever
  // downgrading a "correct" already earned in play.
  for (const ch of hintedChars) {
    const key = ch.toUpperCase();
    const cur = map.get(key) ?? "unused";
    if (RANK["present"] > RANK[cur]) map.set(key, "present");
  }
  return map;
}

export function isWin(states: TileState[]): boolean {
  return states.length > 0 && states.every((s) => s === "correct");
}
