import { describe, expect, it } from "vitest";
import { hashSeed, mulberry32 } from "./rng";

describe("hashSeed", () => {
  it("est déterministe (même chaîne → même graine)", () => {
    expect(hashSeed("2026-06-24-rating")).toBe(hashSeed("2026-06-24-rating"));
  });
  it("change selon la chaîne", () => {
    expect(hashSeed("2026-06-24-rating")).not.toBe(
      hashSeed("2026-06-24-prize"),
    );
  });
});

describe("mulberry32", () => {
  it("rend des floats dans [0, 1)", () => {
    const rand = mulberry32(hashSeed("seed"));
    for (let i = 0; i < 100; i++) {
      const v = rand();
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(1);
    }
  });
  it("est reproductible (même graine → même séquence)", () => {
    const a = mulberry32(123);
    const b = mulberry32(123);
    expect([a(), a(), a()]).toEqual([b(), b(), b()]);
  });
  it("diverge avec une graine différente", () => {
    const a = mulberry32(1);
    const b = mulberry32(2);
    expect(a()).not.toBe(b());
  });
});
