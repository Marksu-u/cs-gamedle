import { describe, expect, it } from "vitest";
import { DAY_MS, dayIndex, dayLabel, msUntilNextRotation } from "./clock";

// Instants absolus (ms epoch) : aucun de ces tests ne dépend du fuseau de l'hôte.
const at = (y: number, m: number, d: number, h = 0, min = 0, s = 0) =>
  Date.UTC(y, m - 1, d, h, min, s);

describe("dayIndex", () => {
  it("bascule à 03:00 UTC, pas à minuit", () => {
    const avant = dayIndex(at(2026, 8, 14, 2, 59, 59));
    const apres = dayIndex(at(2026, 8, 14, 3, 0, 0));
    expect(apres).toBe(avant + 1);
  });

  it("ne bouge pas entre 03:00 et 02:59 le lendemain", () => {
    expect(dayIndex(at(2026, 8, 14, 3, 0, 0))).toBe(
      dayIndex(at(2026, 8, 15, 2, 59, 59)),
    );
  });

  it("avance d'exactement 1 par tranche de 24 h", () => {
    const t = at(2026, 8, 14, 12);
    expect(dayIndex(t + DAY_MS)).toBe(dayIndex(t) + 1);
  });

  it("est identique quel que soit le fuseau de l'hôte", () => {
    // process.env.TZ n'entre nulle part dans le calcul : on le prouve en
    // vérifiant que le résultat ne dépend que du nombre passé.
    const t = at(2026, 8, 14, 12);
    const tz = process.env.TZ;
    process.env.TZ = "Pacific/Kiritimati"; // UTC+14
    const a = dayIndex(t);
    process.env.TZ = "Pacific/Midway"; // UTC-11
    const b = dayIndex(t);
    process.env.TZ = tz;
    expect(a).toBe(b);
  });
});

describe("dayLabel", () => {
  it("rend la date calendaire de la bascule", () => {
    expect(dayLabel(dayIndex(at(2026, 8, 14, 3, 0, 0)))).toBe("2026-08-14");
  });

  it("rend la veille juste avant la bascule", () => {
    expect(dayLabel(dayIndex(at(2026, 8, 14, 2, 59, 59)))).toBe("2026-08-13");
  });
});

describe("msUntilNextRotation", () => {
  it("rend 1 s une seconde avant la bascule", () => {
    expect(msUntilNextRotation(at(2026, 8, 14, 2, 59, 59))).toBe(1000);
  });

  it("rend 24 h pile à la bascule", () => {
    expect(msUntilNextRotation(at(2026, 8, 14, 3, 0, 0))).toBe(DAY_MS);
  });

  it("est toujours dans ]0, DAY_MS]", () => {
    for (let h = 0; h < 24; h++) {
      const ms = msUntilNextRotation(at(2026, 8, 14, h, 30));
      expect(ms).toBeGreaterThan(0);
      expect(ms).toBeLessThanOrEqual(DAY_MS);
    }
  });
});
