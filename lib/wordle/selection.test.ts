import { describe, expect, it } from "vitest";
import {
  availableLengths,
  getGroup,
  isValidGuess,
  pickRandom,
} from "./selection";
import type { WordleData } from "./types";

const data: WordleData = {
  game: "test",
  words: { "3": ["CAT", "DOG", "BAT"], "5": ["HELLO"] },
};

describe("availableLengths", () => {
  it("retourne les longueurs triées (numériques)", () => {
    expect(availableLengths(data)).toEqual([3, 5]);
  });
});

describe("getGroup", () => {
  it("retourne le groupe demandé", () => {
    expect(getGroup(data, 3)).toEqual(["CAT", "DOG", "BAT"]);
  });
  it("retourne [] pour une longueur absente", () => {
    expect(getGroup(data, 4)).toEqual([]);
  });
});

describe("isValidGuess", () => {
  it("vrai si le mot est dans le groupe (insensible à la casse)", () => {
    expect(isValidGuess(getGroup(data, 3), "cat")).toBe(true);
  });
  it("faux sinon", () => {
    expect(isValidGuess(getGroup(data, 3), "XYZ")).toBe(false);
  });
});

describe("pickRandom", () => {
  it("retourne un élément du groupe", () => {
    const group = getGroup(data, 3);
    expect(group).toContain(pickRandom(group));
  });
  it("évite le mot exclu quand c'est possible", () => {
    expect(pickRandom(["A", "B"], "A")).toBe("B");
  });
  it("garde-fou : retourne quand même l'unique mot si tout est exclu", () => {
    expect(pickRandom(["A"], "A")).toBe("A");
  });
});
