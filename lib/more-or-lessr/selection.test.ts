import { describe, expect, it } from "vitest";
import { dailySequence, practiceSequence } from "./selection";
import { TOTAL_ROUNDS, type MorelessData } from "./types";

// Fixture : 28 joueurs, comme le pool réel (le tirage exige pool >= count).
const data: MorelessData = {
  game: "test",
  players: Array.from({ length: 28 }, (_, i) => ({
    name: `P${i}`,
    team: "T",
    nationality: "France",
    peak_rating: 1 + i / 100,
    prize_money: (i + 1) * 100000,
  })),
};

describe("dailySequence", () => {
  it("renvoie TOTAL_ROUNDS + 1 joueurs", () => {
    expect(dailySequence(data, 100, "rating")).toHaveLength(TOTAL_ROUNDS + 1);
  });

  it("est déterministe (même jour + catégorie → même séquence)", () => {
    expect(dailySequence(data, 100, "rating")).toEqual(
      dailySequence(data, 100, "rating"),
    );
  });

  it("diffère selon la catégorie", () => {
    expect(dailySequence(data, 100, "rating")).not.toEqual(
      dailySequence(data, 100, "prize"),
    );
  });

  it("diffère selon le jour", () => {
    expect(dailySequence(data, 100, "rating")).not.toEqual(
      dailySequence(data, 101, "rating"),
    );
  });

  it("ne contient jamais de doublon", () => {
    for (let day = 0; day < 500; day++) {
      const seq = dailySequence(data, day, "rating");
      expect(new Set(seq.map((p) => p.name)).size).toBe(seq.length);
    }
  });

  it("lève une erreur si le pool est trop petit", () => {
    const small: MorelessData = {
      game: "t",
      players: data.players.slice(0, 5),
    };
    expect(() => dailySequence(small, 100, "rating")).toThrow();
  });
});

describe("practiceSequence", () => {
  it("renvoie TOTAL_ROUNDS + 1 joueurs distincts", () => {
    const seq = practiceSequence(data);
    expect(seq).toHaveLength(TOTAL_ROUNDS + 1);
    expect(new Set(seq.map((p) => p.name)).size).toBe(seq.length);
  });

  it("varie d'un appel à l'autre", () => {
    const a = practiceSequence(data)
      .map((p) => p.name)
      .join();
    const b = practiceSequence(data)
      .map((p) => p.name)
      .join();
    // Deux mélanges aléatoires de 28 joueurs : la collision est négligeable.
    expect(a).not.toBe(b);
  });

  it("lève si le pool est trop petit", () => {
    const small: MorelessData = {
      game: "t",
      players: data.players.slice(0, 5),
    };
    expect(() => practiceSequence(small)).toThrow();
  });

  it("ne remonte PAS la chaîne des époques (entraînement instantané)", () => {
    // Le tirage quotidien remonte ~10 000 époques pour la journée courante ;
    // l'entraînement doit rester en dessous de la milliseconde, sinon chaque
    // clic sur « Rejouer » gèle l'interface.
    const t0 = performance.now();
    for (let i = 0; i < 50; i++) practiceSequence(data);
    expect((performance.now() - t0) / 50).toBeLessThan(1);
  });
});
