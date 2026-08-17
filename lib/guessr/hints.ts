import { compareNumber, compareSet, compareText } from "./compare";
import type { FieldResult, HintField, Player } from "./types";

// Columns a hint can reveal, in the order of the grid headers.
export const HINT_FIELDS: HintField[] = [
  "nationality",
  "current_team",
  "previous_teams",
  "role",
  "age",
  "majors",
  "tournaments_won",
];

// Nombre maximal d'indices par partie (chaque indice consomme un essai).
export const MAX_HINTS = 4;

// Builds the revealed cell of a hint: the TARGET's value compared with itself →
// an "exact" match (green), direction "equal" for numbers.
export function buildHintResult(target: Player, field: HintField): FieldResult {
  switch (field) {
    case "nationality":
      return compareText(target.nationality, target.nationality);
    case "current_team":
      return compareText(target.current_team, target.current_team);
    case "previous_teams":
      return compareSet(target.previous_teams, target.previous_teams);
    case "role":
      return compareSet(target.role, target.role);
    case "age":
      return compareNumber(target.age, target.age);
    case "majors":
      return compareNumber(target.majors, target.majors);
    case "tournaments_won":
      return compareNumber(target.tournaments_won, target.tournaments_won);
  }
}
