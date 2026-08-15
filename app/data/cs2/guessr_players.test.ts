import { describe, expect, it } from "vitest";
import data from "./guessr_players.json";
import { nationToFlag } from "@/lib/more-or-lessr/flags";
import type { GuessrData } from "@/lib/guessr/types";

const pool = data as GuessrData;

describe("guessr_players.json", () => {
  it("enough players that the daily puzzle does not go round in circles", () => {
    // The pool IS the cycle: `lib/daily/deck.ts` yields each player once per
    // cycle, so 28 players means the answer returns after 28 days. A floor of 90
    // covers a quarter.
    expect(pool.players.length).toBeGreaterThanOrEqual(90);
  });
  it("every player has all required fields, correctly typed", () => {
    for (const p of pool.players) {
      expect(typeof p.name).toBe("string");
      expect(typeof p.nationality).toBe("string");
      expect(typeof p.current_team).toBe("string");
      expect(Array.isArray(p.previous_teams)).toBe(true);
      expect(Array.isArray(p.role)).toBe(true);
      expect(p.role.length).toBeGreaterThan(0);
      expect(typeof p.age).toBe("number");
      expect(typeof p.majors).toBe("number");
      expect(typeof p.tournaments_won).toBe("number");
      expect(Array.isArray(p.achievements)).toBe(true);
    }
  });
  it("unique names", () => {
    const names = pool.players.map((p) => p.name.toLowerCase());
    expect(new Set(names).size).toBe(names.length);
  });

  it("plausible numeric values", () => {
    const outOfRange = pool.players
      .filter(
        (p) =>
          p.age < 15 ||
          p.age > 45 ||
          p.majors < 0 ||
          p.majors > 4 ||
          p.tournaments_won < 0 ||
          p.tournaments_won > 40 ||
          !Number.isInteger(p.age) ||
          !Number.isInteger(p.majors),
      )
      .map(
        (p) =>
          `${p.name} (âge ${p.age}, ${p.majors} majors, ${p.tournaments_won} tournois)`,
      );
    expect(outOfRange).toEqual([]);
  });

  it("the majors count is consistent with the achievements", () => {
    // A player billed as "2x Major Winner" but with majors: 1 makes the numeric
    // column wrong while the achievement text tells the truth.
    const inconsistent = pool.players
      .filter((p) => {
        const texte = p.achievements.join(" ");
        const mentionne = /(\d)x Major Winner/.exec(texte);
        const annonces = mentionne
          ? Number(mentionne[1])
          : /Major Winner/.test(texte)
            ? 1
            : 0;
        return annonces !== p.majors;
      })
      .map(
        (p) =>
          `${p.name} : majors=${p.majors}, achievements=${JSON.stringify(p.achievements)}`,
      );
    expect(inconsistent).toEqual([]);
  });

  it("roles come from a closed vocabulary", () => {
    // The role column compares by intersection: "AWPer" and "AWP" would never
    // intersect, and the player would see a false negative.
    const CONNUS = ["AWP", "Rifler", "Entry", "Lurker", "Support", "IGL"];
    const unknown = pool.players.flatMap((p) =>
      p.role
        .filter((r) => !CONNUS.includes(r))
        .map((r) => `${p.name} : « ${r} »`),
    );
    expect(unknown).toEqual([]);
  });

  it("one team is always spelled the same way", () => {
    // The team column compares by EXACT TEXT. "Team Spirit" and "Spirit" are
    // then two different teams: a player who names the right club sees red. So we
    // reject two spellings differing only by a "Team" prefix or by case.
    const all = new Set<string>();
    for (const p of pool.players) {
      all.add(p.current_team);
      for (const t of p.previous_teams) all.add(t);
    }
    const canonical = (t: string) =>
      t
        .toLowerCase()
        .replace(/^team\s+/, "")
        .replace(/\s+/g, "");

    const groups = new Map<string, string[]>();
    for (const t of all) {
      const k = canonical(t);
      groups.set(k, [...(groups.get(k) ?? []), t]);
    }
    const collisions = [...groups.values()]
      .filter((v) => v.length > 1)
      .map((v) => v.join(" / "));
    expect(collisions).toEqual([]);
  });

  it("no player lists their current team among former teams", () => {
    const selfListed = pool.players
      .filter((p) => p.previous_teams.includes(p.current_team))
      .map((p) => `${p.name} : ${p.current_team}`);
    expect(selfListed).toEqual([]);
  });

  it("no empty text field", () => {
    const empties = pool.players
      .filter(
        (p) =>
          !p.name.trim() ||
          !p.nationality.trim() ||
          !p.current_team.trim() ||
          p.achievements.some((a) => !a.trim()),
      )
      .map((p) => p.name);
    expect(empties).toEqual([]);
  });
  it("every nationality has a known flag (no 🌍 fallback)", () => {
    // Name the offenders: the default message ("expected 🌍 not to be 🌍")
    // otherwise means hunting through 116 players by hand.
    const flagless = pool.players
      .filter((p) => nationToFlag(p.nationality) === "🌍")
      .map((p) => `${p.name} (${p.nationality})`);
    expect(flagless).toEqual([]);
  });
});
