import { describe, expect, it } from "vitest";
import { cooldownSize, draw, runsPerDeck } from "./deck";

const pool = (n: number) => Array.from({ length: n }, (_, i) => `x${i}`);

// Real pool sizes used by the project (see app/data/cs2/).
const FLUX: [string, number][] = [
  ["guessr", 28],
  ["wordle-3", 42],
  ["wordle-4", 52],
  ["wordle-5", 90],
  ["wordle-6", 77],
  ["wordle-7", 44],
  ["wordle-8", 36],
];

// Smallest observed gap between two appearances of the same item, in draws.
function minGap(
  items: string[],
  streamId: string,
  count: number,
  days: number,
): number {
  const seen = new Map<string, number>();
  let min = Infinity;
  let i = 0;
  for (let day = 0; day < days; day++) {
    for (const item of draw(items, streamId, day, count)) {
      const previous = seen.get(item);
      if (previous !== undefined) min = Math.min(min, i - previous);
      seen.set(item, i++);
    }
  }
  return min;
}

describe("draw — anti-repeat guarantees", () => {
  it.each(FLUX)("%s : no repeat inside the cooldown window", (streamId, n) => {
    const items = pool(n);
    const c = cooldownSize(n, 1);
    const gap = minGap(items, streamId, 1, 2000);
    // Guard: with no repeat at all, `minGap` would return Infinity and the
    // assertion below would pass without proving anything.
    expect(gap).toBeLessThan(Infinity);
    expect(gap).toBeGreaterThan(c);
  });

  it.each(FLUX)(
    "%s : a full cycle yields every item exactly once",
    (streamId, n) => {
      const items = pool(n);
      const drawn = Array.from(
        { length: n },
        (_, d) => draw(items, streamId, d, 1)[0],
      );
      expect(new Set(drawn).size).toBe(n);
    },
  );

  it.each(FLUX)("%s : coverage holds outside epoch 0 too", (streamId, n) => {
    // The previous test only covers days 0..n-1, i.e. epoch 0 — the one epoch
    // that never goes through `applyCooldown`.
    const items = pool(n);
    const drawn = Array.from(
      { length: n },
      (_, d) => draw(items, streamId, 3 * n + d, 1)[0],
    );
    expect(new Set(drawn).size).toBe(n);
  });

  it("More or Lessr: never a duplicate within a run of 11", () => {
    const items = pool(28);
    for (let day = 0; day < 2000; day++) {
      const manche = draw(items, "mol-rating", day, 11);
      expect(manche).toHaveLength(11);
      expect(new Set(manche).size).toBe(11);
    }
  });

  it("More or Lessr: two consecutive runs are never identical", () => {
    const items = pool(28);
    let previousDay = draw(items, "mol-rating", 0, 11).join();
    for (let day = 1; day < 1000; day++) {
      const day_ = draw(items, "mol-rating", day, 11).join();
      expect(day_).not.toBe(previousDay);
      previousDay = day_;
    }
  });
});

describe("draw — real gap in DAYS (what the player feels)", () => {
  // `cooldown` counts DRAWS. At `count = 1` one draw is one day, but More or
  // Lessr consumes 11 a day, so its gap in days is far shorter. The docs once
  // claimed "⌊pool/4⌋ days" for everyone; that was false for the two MoL
  // streams. These values pin it down.
  function minGapInDays(
    items: string[],
    streamId: string,
    count: number,
    days: number,
  ): number {
    const seen = new Map<string, number>();
    let min = Infinity;
    for (let day = 0; day < days; day++) {
      for (const item of draw(items, streamId, day, count)) {
        const previous = seen.get(item);
        if (previous !== undefined) min = Math.min(min, day - previous);
        seen.set(item, day);
      }
    }
    return min;
  }

  it.each(FLUX)(
    "%s : a target does not return for ⌊pool/4⌋ DAYS",
    (streamId, n) => {
      expect(minGapInDays(pool(n), streamId, 1, 2000)).toBeGreaterThan(
        cooldownSize(n, 1),
      );
    },
  );

  it("More or Lessr: the gap is 2 days, not 7", () => {
    // 11 players a day: the 12-draw gap fits inside ~1 day. Not a defect, just a
    // change of unit — but it must not be documented as 7 days.
    expect(minGapInDays(pool(28), "mol-rating", 11, 2000)).toBe(2);
  });
});

describe("draw — determinism", () => {
  it("same (stream, day) → same draw", () => {
    const items = pool(28);
    expect(draw(items, "guessr", 1234, 1)).toEqual(
      draw(items, "guessr", 1234, 1),
    );
  });

  it("two different streams diverge on the same day", () => {
    const items = pool(28);
    expect(draw(items, "mol-rating", 7, 11)).not.toEqual(
      draw(items, "mol-prize", 7, 11),
    );
  });

  it("two different days diverge", () => {
    const items = pool(28);
    expect(draw(items, "guessr", 7, 1)).not.toEqual(
      draw(items, "guessr", 8, 1),
    );
  });

  it("depends on position in the pool, not on content", () => {
    // The shuffle is seeded on (stream, epoch): it picks an INDEX. A reversed
    // pool must therefore yield the mirrored element, not the same one.
    const n = 28;
    const direct = draw(pool(n), "guessr", 5, 1)[0];
    const inverse = draw([...pool(n)].reverse(), "guessr", 5, 1)[0];
    const indice = Number(direct.slice(1));
    expect(inverse).toBe(`x${n - 1 - indice}`);
  });
});

describe("draw — the seam between two epochs", () => {
  // This is the only place a card can come back too early: at `count = 1` the
  // seam falls exactly on day `n`. We target it directly rather than hoping the
  // general simulation happens to cross it.
  it.each(FLUX)("%s : no repeat on either side of the seam", (streamId, n) => {
    const items = pool(n);
    const c = cooldownSize(n, 1);
    for (const seam of [n, 2 * n, 3 * n]) {
      const window = [];
      for (let day = seam - c; day < seam + c; day++) {
        window.push(draw(items, streamId, day, 1)[0]);
      }
      expect(new Set(window).size).toBe(window.length);
    }
  });

  it("More or Lessr: no shared player WITHIN an epoch", () => {
    // runsPerDeck = 2: even and odd days take two disjoint halves of the same
    // deck. A structural property, hence exact.
    const items = pool(28);
    for (const even of [0, 2, 4, 100]) {
      const a = draw(items, "mol-rating", even, 11);
      const b = draw(items, "mol-rating", even + 1, 11);
      expect(b.filter((p) => a.includes(p))).toEqual([]);
    }
  });

  it("More or Lessr: no shared player AT THE SEAM either", () => {
    // The seam falls between an odd day and the next even one. This is the case
    // the "read the raw shuffle" shortcut missed: it let through 2.8 shared
    // players on average. We measure the seam ALONE — averaging over every
    // transition would halve the signal with the structurally-zero ones.
    const items = pool(28);
    const seams: number[] = [];
    for (let day = 1; day < 2000; day += 2) {
      const previousDay = draw(items, "mol-rating", day, 11);
      const nextDay = draw(items, "mol-rating", day + 1, 11);
      seams.push(nextDay.filter((p) => previousDay.includes(p)).length);
    }
    expect(seams.length).toBeGreaterThan(900);
    expect(Math.max(...seams)).toBe(0);
  });

  it("More or Lessr: a player does not return for 11 draws", () => {
    const items = pool(28);
    const gap = minGap(items, "mol-rating", 11, 1000);
    expect(gap).toBeLessThan(Infinity);
    expect(gap).toBeGreaterThanOrEqual(11);
  });
});

describe("draw — input validation", () => {
  it("throws when the pool is smaller than 4", () => {
    expect(() => draw(pool(3), "test", 0, 1)).toThrow(/pool/i);
  });

  it("throws when count exceeds the pool size", () => {
    expect(() => draw(pool(10), "test", 0, 11)).toThrow(/count/i);
  });

  it("throws when count is zero or negative", () => {
    expect(() => draw(pool(10), "test", 0, 0)).toThrow(/count/i);
  });

  it("throws when count is not an integer", () => {
    expect(() => draw(pool(10), "test", 0, 1.5)).toThrow(/count/i);
  });

  it("throws on a negative day rather than returning an empty slice", () => {
    // Without this guard `slot` goes negative and `slice` returns [] or a
    // shifted window: an empty puzzle shipped to everyone, with no error.
    expect(() => draw(pool(28), "guessr", -1, 1)).toThrow(/day/i);
    expect(() => draw(pool(28), "mol-rating", -2, 11)).toThrow(/day/i);
  });

  it("throws on a non-integer or non-finite day", () => {
    expect(() => draw(pool(28), "guessr", 1.5, 1)).toThrow(/day/i);
    expect(() => draw(pool(28), "guessr", NaN, 1)).toThrow(/day/i);
    expect(() => draw(pool(28), "guessr", Infinity, 1)).toThrow(/day/i);
  });
});

describe("runsPerDeck / cooldownSize", () => {
  it("runsPerDeck: 1 draw/day consumes the whole deck", () => {
    expect(runsPerDeck(28, 1)).toBe(28);
  });

  it("runsPerDeck: 11 of 28 gives 2 runs per epoch", () => {
    expect(runsPerDeck(28, 11)).toBe(2);
  });

  it("cooldownSize: a quarter of the pool for a single draw", () => {
    expect(cooldownSize(28, 1)).toBe(7);
    expect(cooldownSize(90, 1)).toBe(22);
  });

  it("cooldownSize: at least `count` for a multi-draw", () => {
    expect(cooldownSize(28, 11)).toBe(11);
  });
});
