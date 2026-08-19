import { describe, expect, it } from "vitest";
import { validateSnapshot } from "./validate";
import type { Snapshot } from "./types";

// Names are zero-padded so the fixture is already in canonical order: `P10`
// sorts before `P2`, and an unpadded pool would trip the order check the gate is
// built around.
function bon(): Snapshot {
  return {
    day: 100,
    generatedAt: "2026-08-18T00:00:00.000Z",
    source: "manual",
    guessr: {
      game: "cs2",
      players: Array.from({ length: 95 }, (_, i) => ({
        name: `P${String(i).padStart(3, "0")}`,
        nationality: "France",
        current_team: "T",
        previous_teams: [],
        role: ["AWP"],
        age: 25,
        majors: 0,
        tournaments_won: 1,
        achievements: [],
      })),
    },
    moreless: {
      game: "cs2",
      players: Array.from({ length: 30 }, (_, i) => ({
        name: `M${String(i).padStart(3, "0")}`,
        team: "T",
        nationality: "France",
        tournaments_won: i,
        prize_money: 1000 + i,
      })),
    },
    wordle: {
      game: "cs2",
      words: { "5": ["ZYWOO", "APEXX", "B1TXX", "ROPZZ"] },
    },
  };
}

describe("validateSnapshot", () => {
  it("accepts a well-formed snapshot", () => {
    expect(validateSnapshot(bon())).toEqual({ ok: true });
  });

  it("rejects a guessr pool that collapsed", () => {
    // A query change that returns twelve players must fail loudly, not quietly
    // shrink the rotation to a fortnight.
    const s = bon();
    s.guessr.players = s.guessr.players.slice(0, 12);
    const r = validateSnapshot(s);
    expect(r.ok).toBe(false);
    expect(r.ok === false && r.errors.join(" ")).toMatch(/guessr/i);
  });

  it("rejects an out-of-range age", () => {
    const s = bon();
    s.guessr.players[0].age = 0;
    expect(validateSnapshot(s).ok).toBe(false);
  });

  it("rejects a negative count", () => {
    const s = bon();
    s.guessr.players[3].majors = -1;
    expect(validateSnapshot(s).ok).toBe(false);
  });

  it("rejects an empty string in a compared column", () => {
    const s = bon();
    s.guessr.players[7].current_team = "";
    expect(validateSnapshot(s).ok).toBe(false);
  });

  it("rejects NaN in a numeric field", () => {
    const s = bon();
    s.moreless.players[2].prize_money = Number.NaN;
    expect(validateSnapshot(s).ok).toBe(false);
  });

  it("rejects duplicate names in a pool", () => {
    const s = bon();
    s.guessr.players[1].name = s.guessr.players[0].name;
    expect(validateSnapshot(s).ok).toBe(false);
  });

  it("rejects an un-canonicalised pool", () => {
    const s = bon();
    [s.guessr.players[0], s.guessr.players[1]] = [
      s.guessr.players[1],
      s.guessr.players[0],
    ];
    const r = validateSnapshot(s);
    expect(r.ok).toBe(false);
    expect(r.ok === false && r.errors.join(" ")).toMatch(
      /order|sorted|canonical/i,
    );
  });

  it("collects every problem rather than stopping at the first", () => {
    const s = bon();
    s.guessr.players[0].age = 0;
    s.moreless.players[0].prize_money = -5;
    const r = validateSnapshot(s);
    expect(r.ok === false && r.errors.length).toBeGreaterThan(1);
  });
});
