import { describe, expect, it } from "vitest";
import {
  DAY_MS,
  dayIndex,
  LAUNCH_DAY,
  msUntilNextRotation,
  puzzleNumber,
} from "./clock";

// Absolute instants (epoch ms): none of these tests depends on the host timezone.
const at = (y: number, m: number, d: number, h = 0, min = 0, s = 0) =>
  Date.UTC(y, m - 1, d, h, min, s);

describe("dayIndex", () => {
  it("rolls over at 03:00 UTC, not at midnight", () => {
    const before = dayIndex(at(2026, 8, 14, 2, 59, 59));
    const after = dayIndex(at(2026, 8, 14, 3, 0, 0));
    expect(after).toBe(before + 1);
  });

  it("does not move between 03:00 and 02:59 the next day", () => {
    expect(dayIndex(at(2026, 8, 14, 3, 0, 0))).toBe(
      dayIndex(at(2026, 8, 15, 2, 59, 59)),
    );
  });

  it("advances by exactly 1 per 24h", () => {
    const t = at(2026, 8, 14, 12);
    expect(dayIndex(t + DAY_MS)).toBe(dayIndex(t) + 1);
  });

  it("is identical whatever the host timezone", () => {
    // process.env.TZ plays no part in the computation: proven by checking the
    // result depends only on the number passed in.
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

describe("puzzleNumber", () => {
  it("numbers launch day as 1", () => {
    expect(puzzleNumber(LAUNCH_DAY)).toBe(1);
  });

  it("counts one per day after launch", () => {
    expect(puzzleNumber(LAUNCH_DAY + 226)).toBe(227);
  });
});

describe("msUntilNextRotation", () => {
  it("returns 1s one second before the rollover", () => {
    expect(msUntilNextRotation(at(2026, 8, 14, 2, 59, 59))).toBe(1000);
  });

  it("returns exactly 24h at the rollover", () => {
    expect(msUntilNextRotation(at(2026, 8, 14, 3, 0, 0))).toBe(DAY_MS);
  });

  it("is always within ]0, DAY_MS]", () => {
    for (let h = 0; h < 24; h++) {
      const ms = msUntilNextRotation(at(2026, 8, 14, h, 30));
      expect(ms).toBeGreaterThan(0);
      expect(ms).toBeLessThanOrEqual(DAY_MS);
    }
  });
});
