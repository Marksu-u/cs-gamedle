import type { KeyState, TileState } from "./types";

// Algorithme Wordle en DEUX passes. Indispensable pour les doublons : on marque
// d'abord tous les "correct" et on décompte les occurrences restantes de la
// cible, sinon un caractère deviné en double serait marqué "present" trop de fois.
export function evaluateGuess(guess: string, target: string): TileState[] {
  const g = guess.toUpperCase();
  const t = target.toUpperCase();
  const states: TileState[] = new Array(g.length).fill("absent");

  // Compte des caractères de la cible encore "disponibles" pour un marquage present.
  const remaining: Record<string, number> = {};
  for (const ch of t) remaining[ch] = (remaining[ch] ?? 0) + 1;

  // Passe 1 — "correct" : bonne lettre, bonne place. On consomme l'occurrence.
  for (let i = 0; i < g.length; i++) {
    if (g[i] === t[i]) {
      states[i] = "correct";
      remaining[g[i]]--;
    }
  }

  // Passe 2 — "present" : tant qu'il reste une occurrence à consommer, sinon absent.
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

// Priorité des états pour colorer le clavier : un caractère garde son meilleur
// état rencontré (un "absent" ne doit jamais écraser un "correct" déjà obtenu).
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
      if (s === "empty") continue; // sécurité : les essais soumis n'ont pas d'empty
      const cur = map.get(g[i]) ?? "unused";
      if (RANK[s] > RANK[cur]) map.set(g[i], s);
    }
  }
  // Indices : un caractère indicé apparaît "present" au clavier, sans jamais
  // rétrograder un "correct" déjà obtenu par le jeu.
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
