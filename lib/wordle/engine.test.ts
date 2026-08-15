import { describe, expect, it } from "vitest";
import { deriveKeyStates, evaluateGuess, isWin } from "./engine";
import type { TileState } from "./types";

describe("evaluateGuess", () => {
  it("tout correct quand l'essai = la cible", () => {
    expect(evaluateGuess("CAT", "CAT")).toEqual([
      "correct",
      "correct",
      "correct",
    ]);
  });

  it("tout absent quand aucune lettre commune", () => {
    expect(evaluateGuess("DOG", "CAT")).toEqual(["absent", "absent", "absent"]);
  });

  it("present pour une lettre bien devinée mais mal placée", () => {
    // target DOG, guess GOD: O in place, G and D present elsewhere.
    expect(evaluateGuess("GOD", "DOG")).toEqual([
      "present",
      "correct",
      "present",
    ]);
  });

  it("ne sur-marque pas un caractère en double (cible n'en a qu'un)", () => {
    // target ROPZ (a single O), guess OOOO: only the correctly placed O counts.
    expect(evaluateGuess("OOOO", "ROPZ")).toEqual([
      "absent",
      "correct",
      "absent",
      "absent",
    ]);
  });

  it("gère les chiffres comme des caractères normaux", () => {
    // target B1T, guess T1B: 1 in place, B and T present.
    expect(evaluateGuess("T1B", "B1T")).toEqual([
      "present",
      "correct",
      "present",
    ]);
  });
});

describe("deriveKeyStates", () => {
  it("mappe chaque caractère à son état d'après les essais", () => {
    const guesses = ["GOD"];
    const evals: TileState[][] = [["present", "correct", "present"]];
    const m = deriveKeyStates(guesses, evals);
    expect(m.get("O")).toBe("correct");
    expect(m.get("G")).toBe("present");
    expect(m.get("D")).toBe("present");
  });

  it("promeut au meilleur état (correct > present > absent)", () => {
    // O d'abord present, puis correct → doit finir correct.
    const guesses = ["AO", "OA"];
    const evals: TileState[][] = [
      ["absent", "present"],
      ["correct", "absent"],
    ];
    const m = deriveKeyStates(guesses, evals);
    expect(m.get("O")).toBe("correct");
    expect(m.get("A")).toBe("absent");
  });

  it("un caractère indicé apparaît present au clavier", () => {
    const m = deriveKeyStates([], [], ["z"]);
    expect(m.get("Z")).toBe("present");
  });

  it("un indice ne rétrograde pas un correct déjà obtenu par un essai", () => {
    const guesses = ["O"];
    const evals: TileState[][] = [["correct"]];
    const m = deriveKeyStates(guesses, evals, ["O"]);
    expect(m.get("O")).toBe("correct");
  });
});

describe("isWin", () => {
  it("true si toutes les tuiles sont correct", () => {
    expect(isWin(["correct", "correct"])).toBe(true);
  });
  it("false sinon", () => {
    expect(isWin(["correct", "present"])).toBe(false);
    expect(isWin([])).toBe(false);
  });
});
