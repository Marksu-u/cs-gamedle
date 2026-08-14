import { describe, expect, it } from "vitest";
import { randomTarget } from "./selection";
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
