import { describe, expect, it } from "vitest";
import { buildHintResult, HINT_FIELDS, MAX_HINTS } from "./hints";
import type { Player } from "./types";

const target: Player = {
  name: "ZywOo",
  nationality: "France",
  current_team: "Vitality",
  previous_teams: ["aAa", "Envy"],
  role: ["AWPer", "Rifler"],
  age: 24,
  majors: 2,
  tournaments_won: 15,
  achievements: [],
};

describe("buildHintResult", () => {
  it("révèle chaque champ en vert (exact) avec la valeur de la cible", () => {
    for (const field of HINT_FIELDS) {
      const r = buildHintResult(target, field);
      expect(r.match).toBe("exact");
    }
  });

  it("révèle la valeur exacte de la cible par champ", () => {
    expect(buildHintResult(target, "nationality")).toMatchObject({
      kind: "text",
      value: "France",
    });
    expect(buildHintResult(target, "current_team")).toMatchObject({
      kind: "text",
      value: "Vitality",
    });
    expect(buildHintResult(target, "previous_teams")).toMatchObject({
      kind: "set",
      value: ["aAa", "Envy"],
    });
    expect(buildHintResult(target, "role")).toMatchObject({
      kind: "set",
      value: ["AWPer", "Rifler"],
    });
  });

  it("les champs numériques ont direction === equal", () => {
    for (const field of ["age", "majors", "tournaments_won"] as const) {
      const r = buildHintResult(target, field);
      expect(r.kind).toBe("number");
      if (r.kind === "number") {
        expect(r.direction).toBe("equal");
        expect(r.value).toBe(target[field]);
      }
    }
  });

  it("expose 7 champs et un plafond de 4 indices", () => {
    expect(HINT_FIELDS).toHaveLength(7);
    expect(MAX_HINTS).toBe(4);
  });
});
