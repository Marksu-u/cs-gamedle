import { describe, expect, it } from "vitest";
import { dailySequence } from "./selection";
import { TOTAL_ROUNDS, type MorelessData } from "./types";

// Fixture : 14 joueurs distincts (> 11 requis).
const data: MorelessData = {
  game: "test",
  players: Array.from({ length: 14 }, (_, i) => ({
    name: `P${i}`,
    team: "T",
    nationality: "France",
    peak_rating: 1 + i / 100,
    prize_money: (i + 1) * 100000,
  })),
};

describe("dailySequence", () => {
  it("renvoie TOTAL_ROUNDS + 1 joueurs", () => {
    expect(dailySequence(data, "2026-06-24", "rating")).toHaveLength(
      TOTAL_ROUNDS + 1,
    );
  });
  it("est déterministe (même date + catégorie → même séquence)", () => {
    expect(dailySequence(data, "2026-06-24", "rating")).toEqual(
      dailySequence(data, "2026-06-24", "rating"),
    );
  });
  it("diffère selon la catégorie", () => {
    expect(dailySequence(data, "2026-06-24", "rating")).not.toEqual(
      dailySequence(data, "2026-06-24", "prize"),
    );
  });
  it("diffère selon la date", () => {
    expect(dailySequence(data, "2026-06-24", "rating")).not.toEqual(
      dailySequence(data, "2026-06-25", "rating"),
    );
  });
  it("ne contient pas de doublon", () => {
    const seq = dailySequence(data, "2026-06-24", "rating");
    expect(new Set(seq.map((p) => p.name)).size).toBe(seq.length);
  });
  it("lève une erreur si le pool est trop petit", () => {
    const small: MorelessData = {
      game: "t",
      players: data.players.slice(0, 5),
    };
    expect(() => dailySequence(small, "2026-06-24", "rating")).toThrow();
  });
});
