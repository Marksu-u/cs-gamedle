import { describe, expect, it } from "vitest";
import { dailyTarget, randomTarget } from "./selection";
import type { GuessrData } from "./types";

const data: GuessrData = {
  game: "guessr",
  players: ["a", "b", "c", "d", "e"].map((name) => ({
    name,
    nationality: "France",
    current_team: "T",
    previous_teams: [],
    role: ["Rifler"],
    age: 25,
    majors: 0,
    tournaments_won: 0,
    achievements: [],
  })),
};

describe("randomTarget", () => {
  it("retourne un joueur du pool", () => {
    expect(data.players.map((p) => p.name)).toContain(randomTarget(data).name);
  });
  it("indexe via rand : 0 → premier, ~1 → dernier", () => {
    expect(randomTarget(data, () => 0).name).toBe("a");
    expect(randomTarget(data, () => 0.999).name).toBe("e");
  });
  it("lève si le pool est vide", () => {
    expect(() => randomTarget({ game: "guessr", players: [] })).toThrow();
  });
});

describe("dailyTarget", () => {
  const data: GuessrData = {
    game: "test",
    players: Array.from({ length: 28 }, (_, i) => ({
      name: `P${i}`,
      nationality: "France",
      current_team: "T",
      previous_teams: [],
      role: ["rifler"],
      age: 20 + i,
      majors: 0,
      tournaments_won: 0,
      achievements: [],
    })),
  };

  it("rend le même joueur pour un jour donné", () => {
    expect(dailyTarget(data, 100)).toEqual(dailyTarget(data, 100));
  });

  it("change de jour en jour", () => {
    expect(dailyTarget(data, 100)).not.toEqual(dailyTarget(data, 101));
  });

  it("ne répète pas un joueur sur un cycle complet", () => {
    const noms = Array.from(
      { length: 28 },
      (_, d) => dailyTarget(data, d).name,
    );
    expect(new Set(noms).size).toBe(28);
  });
});
