import type {
  Direction,
  FieldResult,
  GuessResult,
  Match,
  Player,
} from "./types";

// Normalisation commune des comparaisons texte : insensible casse + espaces.
export function norm(s: string): string {
  return s.trim().toLowerCase();
}

// Text column (nationality, current team): exact or miss.
export function compareText(guess: string, target: string): FieldResult {
  const match: Match = norm(guess) === norm(target) ? "exact" : "miss";
  return { kind: "text", match, value: guess };
}

// Set column (former teams, role): exact when the sets are equal, partial when
// they intersect, miss otherwise. Order and case are ignored.
export function compareSet(guess: string[], target: string[]): FieldResult {
  const g = new Set(guess.map(norm));
  const t = new Set(target.map(norm));
  const shared = [...g].filter((x) => t.has(x));
  let match: Match;
  if (g.size === t.size && shared.length === g.size) match = "exact";
  else if (shared.length > 0) match = "partial";
  else match = "miss";
  return { kind: "set", match, value: guess };
}

// Numeric column (age, majors, tournaments): exact when equal, otherwise miss + arrow
// pointant vers la valeur de la CIBLE relative au guess.
export function compareNumber(
  guess: number,
  target: number,
): Extract<FieldResult, { kind: "number" }> {
  const match: Match = guess === target ? "exact" : "miss";
  const direction: Direction =
    target > guess ? "up" : target < guess ? "down" : "equal";
  return { kind: "number", match, value: guess, direction };
}

// Compares a guess against the target → state of all 8 columns.
export function compareGuess(guess: Player, target: Player): GuessResult {
  return {
    player: guess,
    correct: norm(guess.name) === norm(target.name),
    nationality: compareText(guess.nationality, target.nationality),
    current_team: compareText(guess.current_team, target.current_team),
    previous_teams: compareSet(guess.previous_teams, target.previous_teams),
    role: compareSet(guess.role, target.role),
    age: compareNumber(guess.age, target.age),
    majors: compareNumber(guess.majors, target.majors),
    tournaments_won: compareNumber(
      guess.tournaments_won,
      target.tournaments_won,
    ),
  };
}
