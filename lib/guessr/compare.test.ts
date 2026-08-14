import { describe, expect, it } from "vitest";
import {
  compareGuess,
  compareNumber,
  compareSet,
  compareText,
  norm,
} from "./compare";
import type { Player } from "./types";

const target: Player = {
  name: "ropz",
  nationality: "Estonia",
  current_team: "Vitality",
  previous_teams: ["FaZe", "MOUZ"],
  role: ["Rifler", "Lurker"],
  age: 25,
  majors: 2,
  tournaments_won: 3,
  achievements: [],
};

describe("norm", () => {
  it("trim + lowercase", () => {
    expect(norm("  FaZe ")).toBe("faze");
  });
});

describe("compareText", () => {
  it("exact insensible à la casse", () => {
    expect(compareText("estonia", "Estonia").match).toBe("exact");
  });
  it("miss sinon", () => {
    expect(compareText("France", "Estonia").match).toBe("miss");
  });
});

describe("compareSet", () => {
  it("exact si ensembles identiques (ordre ignoré)", () => {
    expect(compareSet(["MOUZ", "FaZe"], ["FaZe", "MOUZ"]).match).toBe("exact");
  });
  it("partial si intersection non vide mais différents", () => {
    expect(compareSet(["FaZe", "G2"], ["FaZe", "MOUZ"]).match).toBe("partial");
  });
  it("miss si intersection vide", () => {
    expect(compareSet(["NAVI"], ["FaZe", "MOUZ"]).match).toBe("miss");
  });
});

describe("compareNumber", () => {
  it("exact + direction equal", () => {
    const r = compareNumber(25, 25);
    expect(r.match).toBe("exact");
    expect(r.direction).toBe("equal");
  });
  it("up si la cible est plus grande que le guess", () => {
    const r = compareNumber(22, 25);
    expect(r.match).toBe("miss");
    expect(r.direction).toBe("up");
  });
  it("down si la cible est plus petite", () => {
    expect(compareNumber(30, 25).direction).toBe("down");
  });
});

describe("compareGuess", () => {
  it("correct=true quand le nom correspond", () => {
    expect(compareGuess(target, target).correct).toBe(true);
  });
  it("agrège les 8 colonnes", () => {
    const guess: Player = {
      ...target,
      name: "frozen",
      nationality: "Slovakia",
      current_team: "FaZe",
      previous_teams: ["MOUZ"],
      role: ["Rifler"],
      age: 22,
      majors: 1,
      tournaments_won: 3,
    };
    const r = compareGuess(guess, target);
    expect(r.correct).toBe(false);
    expect(r.nationality.match).toBe("miss");
    expect(r.current_team.match).toBe("miss");
    expect(r.previous_teams.match).toBe("partial");
    expect(r.role.match).toBe("partial");
    expect(r.age).toEqual({ kind: "number", match: "miss", value: 22, direction: "up" });
    expect(r.tournaments_won.match).toBe("exact");
  });
});
