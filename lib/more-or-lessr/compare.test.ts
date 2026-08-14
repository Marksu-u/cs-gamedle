import { describe, expect, it } from "vitest";
import { isCorrectGuess, statValue } from "./compare";
import type { Player } from "./types";

const strong: Player = {
  name: "A",
  team: "T",
  nationality: "France",
  peak_rating: 1.3,
  prize_money: 500000,
};
const weak: Player = {
  name: "B",
  team: "T",
  nationality: "France",
  peak_rating: 1.1,
  prize_money: 900000,
};

describe("statValue", () => {
  it("rating → peak_rating", () => {
    expect(statValue(strong, "rating")).toBe(1.3);
  });
  it("prize → prize_money", () => {
    expect(statValue(strong, "prize")).toBe(500000);
  });
});

describe("isCorrectGuess", () => {
  it("'more' juste si le challenger a une valeur supérieure à l'ancre", () => {
    // ancre = weak (1.1), challenger = strong (1.3)
    expect(isCorrectGuess(weak, strong, "rating", "more")).toBe(true);
    expect(isCorrectGuess(weak, strong, "rating", "less")).toBe(false);
  });
  it("'less' juste si le challenger a une valeur inférieure à l'ancre", () => {
    // ancre = strong (1.3), challenger = weak (1.1)
    expect(isCorrectGuess(strong, weak, "rating", "less")).toBe(true);
    expect(isCorrectGuess(strong, weak, "rating", "more")).toBe(false);
  });
  it("respecte la catégorie (prize : weak 900k > strong 500k)", () => {
    expect(isCorrectGuess(strong, weak, "prize", "more")).toBe(true);
  });
  it("égalité comptée juste dans les deux sens", () => {
    const tie: Player = { ...strong, name: "C" };
    expect(isCorrectGuess(strong, tie, "rating", "more")).toBe(true);
    expect(isCorrectGuess(strong, tie, "rating", "less")).toBe(true);
  });
});
