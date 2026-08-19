import { describe, expect, it } from "vitest";
import { isCorrectGuess, statValue } from "./compare";
import type { Player } from "./types";

const strong: Player = {
  name: "A",
  team: "T",
  nationality: "France",
  tournaments_won: 13,
  prize_money: 500000,
};
const weak: Player = {
  name: "B",
  team: "T",
  nationality: "France",
  tournaments_won: 11,
  prize_money: 900000,
};

describe("statValue", () => {
  it("tournaments → tournaments_won", () => {
    expect(statValue(strong, "tournaments")).toBe(13);
  });
  it("prize → prize_money", () => {
    expect(statValue(strong, "prize")).toBe(500000);
  });
});

describe("isCorrectGuess", () => {
  it("'more' juste si le challenger a une valeur supérieure à l'ancre", () => {
    // ancre = weak (11), challenger = strong (13)
    expect(isCorrectGuess(weak, strong, "tournaments", "more")).toBe(true);
    expect(isCorrectGuess(weak, strong, "tournaments", "less")).toBe(false);
  });
  it("'less' juste si le challenger a une valeur inférieure à l'ancre", () => {
    // ancre = strong (13), challenger = weak (11)
    expect(isCorrectGuess(strong, weak, "tournaments", "less")).toBe(true);
    expect(isCorrectGuess(strong, weak, "tournaments", "more")).toBe(false);
  });
  it("respecte la catégorie (prize : weak 900k > strong 500k)", () => {
    expect(isCorrectGuess(strong, weak, "prize", "more")).toBe(true);
  });
  it("égalité comptée juste dans les deux sens", () => {
    const tie: Player = { ...strong, name: "C" };
    expect(isCorrectGuess(strong, tie, "tournaments", "more")).toBe(true);
    expect(isCorrectGuess(strong, tie, "tournaments", "less")).toBe(true);
  });
});
