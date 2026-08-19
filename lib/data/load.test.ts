import { describe, expect, it } from "vitest";
import { loadSnapshotFrom } from "./load";
import { memoryStore } from "./stores/memory";
import { manualAdapter } from "./adapters/manual";

async function snapFor(
  day: number,
  source: "manual" | "liquipedia" = "liquipedia",
) {
  return { ...(await manualAdapter.build(day)), source };
}

describe("loadSnapshotFrom", () => {
  it("serves today's snapshot when it exists", async () => {
    const store = memoryStore([await snapFor(100), await snapFor(99)]);
    const s = await loadSnapshotFrom(store, 100);
    expect(s.day).toBe(100);
  });

  it("falls back to the last good snapshot when today's is missing", async () => {
    // The cron failed or the gate refused to publish. Yesterday's data is stale
    // by a day, which is invisible; an error page is not.
    const store = memoryStore([await snapFor(97)]);
    const s = await loadSnapshotFrom(store, 100);
    expect(s.day).toBe(97);
  });

  it("falls back to the committed JSON when the store is empty", async () => {
    const s = await loadSnapshotFrom(memoryStore([]), 100);
    expect(s.source).toBe("manual");
    expect(s.day).toBe(100);
  });

  it("falls back to the committed JSON when the store throws", async () => {
    const casse = {
      async get(): Promise<never> {
        throw new Error("blob down");
      },
      async latestAtOrBefore(): Promise<never> {
        throw new Error("blob down");
      },
      async put() {},
    };
    const s = await loadSnapshotFrom(casse, 100);
    expect(s.source).toBe("manual");
  });

  it("rejects a stored snapshot that fails the gate and falls through", async () => {
    // A snapshot written before the gate existed, or corrupted at rest, must not
    // reach the games just because it parsed.
    const pourri = await snapFor(100);
    pourri.guessr.players = pourri.guessr.players.slice(0, 3);
    const s = await loadSnapshotFrom(memoryStore([pourri]), 100);
    expect(s.source).toBe("manual");
  });
});
