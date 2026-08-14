import { describe, expect, it } from "vitest";
import data from "./guessr_players.json";
import { nationToFlag } from "@/lib/more-or-lessr/flags";
import type { GuessrData } from "@/lib/guessr/types";

const pool = data as GuessrData;

describe("guessr_players.json", () => {
  it("au moins 28 joueurs", () => {
    expect(pool.players.length).toBeGreaterThanOrEqual(28);
  });
  it("chaque joueur a tous les champs requis et bien typés", () => {
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
  it("noms uniques", () => {
    const names = pool.players.map((p) => p.name.toLowerCase());
    expect(new Set(names).size).toBe(names.length);
  });
  it("chaque nationalité a un drapeau connu (pas de fallback 🌍)", () => {
    for (const p of pool.players) {
      expect(nationToFlag(p.nationality)).not.toBe("🌍");
    }
  });
});
