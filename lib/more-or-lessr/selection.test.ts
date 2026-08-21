import { describe, expect, it } from "vitest";
import { statValue } from "./compare";
import { dailySequence, practiceSequence } from "./selection";
import { TOTAL_ROUNDS, type MorelessData } from "./types";

// Fixture: 28 players, like the real pool (the draw requires pool >= count).
const data: MorelessData = {
  game: "test",
  updated: "2026-07-31",
  players: Array.from({ length: 28 }, (_, i) => ({
    name: `P${i}`,
    team: "T",
    nationality: "France",
    tournaments_won: i,
    prize_money: (i + 1) * 100000,
  })),
};

describe("dailySequence", () => {
  it("returns TOTAL_ROUNDS + 1 players", () => {
    expect(dailySequence(data, 100, "tournaments")).toHaveLength(
      TOTAL_ROUNDS + 1,
    );
  });

  it("is deterministic (same day + category → same sequence)", () => {
    expect(dailySequence(data, 100, "tournaments")).toEqual(
      dailySequence(data, 100, "tournaments"),
    );
  });

  it("differs by category", () => {
    expect(dailySequence(data, 100, "tournaments")).not.toEqual(
      dailySequence(data, 100, "prize"),
    );
  });

  it("differs by day", () => {
    expect(dailySequence(data, 100, "tournaments")).not.toEqual(
      dailySequence(data, 101, "tournaments"),
    );
  });

  it("never contains a duplicate", () => {
    for (let day = 0; day < 500; day++) {
      const seq = dailySequence(data, day, "tournaments");
      expect(new Set(seq.map((p) => p.name)).size).toBe(seq.length);
    }
  });

  it("throws when the pool is too small", () => {
    const small: MorelessData = {
      game: "t",
      updated: "2026-07-31",
      players: data.players.slice(0, 5),
    };
    expect(() => dailySequence(small, 100, "tournaments")).toThrow();
  });
});

describe("practiceSequence", () => {
  it("returns TOTAL_ROUNDS + 1 players distincts", () => {
    const seq = practiceSequence(data, "tournaments");
    expect(seq).toHaveLength(TOTAL_ROUNDS + 1);
    expect(new Set(seq.map((p) => p.name)).size).toBe(seq.length);
  });

  it("varies from call to call", () => {
    const a = practiceSequence(data, "tournaments")
      .map((p) => p.name)
      .join();
    const b = practiceSequence(data, "tournaments")
      .map((p) => p.name)
      .join();
    // Two random shuffles of 28 players: a collision is negligible.
    expect(a).not.toBe(b);
  });

  it("throws when the pool is too small", () => {
    const small: MorelessData = {
      game: "t",
      updated: "2026-07-31",
      players: data.players.slice(0, 5),
    };
    expect(() => practiceSequence(small, "tournaments")).toThrow();
  });

  it("does NOT walk the epoch chain (instant practice)", () => {
    // The daily draw walks ~10,000 epochs for the current day; practice must stay
    // under a millisecond, otherwise every "Play again" click freezes the UI.
    const t0 = performance.now();
    for (let i = 0; i < 50; i++) practiceSequence(data, "tournaments");
    expect((performance.now() - t0) / 50).toBeLessThan(1);
  });
});

// A pool with heavy duplication on `tournaments_won`, which is what the real
// data looks like: a small integer over a few hundred players collides
// constantly. Prize money stays distinct so the other category is unaffected.
const tiedPool: MorelessData = {
  game: "cs2",
  updated: "2026-07-31",
  players: Array.from({ length: 40 }, (_, i) => ({
    name: `p${i}`,
    team: "T",
    nationality: "France",
    tournaments_won: i % 5, // only five distinct values across forty players
    prize_money: 1000 + i,
  })),
};

describe("dailySequence — tie rejection", () => {
  it("never places two equal tournament counts side by side", () => {
    for (let day = 0; day < 200; day++) {
      const seq = dailySequence(tiedPool, day, "tournaments");
      expect(seq).toHaveLength(TOTAL_ROUNDS + 1);
      for (let i = 1; i < seq.length; i++) {
        expect(statValue(seq[i], "tournaments")).not.toBe(
          statValue(seq[i - 1], "tournaments"),
        );
      }
    }
  });

  it("keeps the sequence deterministic for a given day", () => {
    expect(dailySequence(tiedPool, 42, "tournaments")).toEqual(
      dailySequence(tiedPool, 42, "tournaments"),
    );
  });

  it("still returns the same players, only reordered", () => {
    const seq = dailySequence(tiedPool, 7, "tournaments");
    expect(new Set(seq.map((p) => p.name)).size).toBe(seq.length);
  });
});
