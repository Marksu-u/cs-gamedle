import { mkdtemp, mkdir, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { fsStore } from "./fs";
import type { Snapshot } from "../types";

// Pools stay empty: this file is about the store, not about the data. The gate
// in ../validate.ts is what has opinions on what a pool must contain.
function snap(day: number): Snapshot {
  return {
    day,
    generatedAt: "2026-08-18T00:00:00.000Z",
    dataDate: "2026-07-31",
    source: "manual",
    guessr: { game: "cs2", updated: "2026-07-31", players: [] },
    moreless: { game: "cs2", updated: "2026-07-31", players: [] },
    wordle: { game: "cs2", updated: "2026-07-31", words: {} },
  };
}

let dir: string;

beforeEach(async () => {
  dir = await mkdtemp(join(tmpdir(), "cs-gamedle-snapshots-"));
});
afterEach(async () => {
  await rm(dir, { recursive: true, force: true });
});

describe("fsStore — round trip", () => {
  it("reads back what it wrote", async () => {
    const store = fsStore(dir);
    await store.put(snap(100));
    expect(await store.get(100)).toEqual(snap(100));
  });

  it("creates the directory on first write", async () => {
    const neuf = join(dir, "pas", "encore", "la");
    const store = fsStore(neuf);
    await store.put(snap(7));
    expect(await store.get(7)).toEqual(snap(7));
  });

  it("keeps one file per day", async () => {
    const store = fsStore(dir);
    await store.put(snap(1));
    await store.put(snap(2));
    expect((await store.get(1))?.day).toBe(1);
    expect((await store.get(2))?.day).toBe(2);
  });
});

describe("fsStore — never throws on a read", () => {
  // Same rule as lib/daily/storage.ts: an unreadable snapshot must fall through
  // the chain in ../load.ts, not take the page down with it.
  it("returns null for a day never written", async () => {
    expect(await fsStore(dir).get(404)).toBeNull();
  });

  it("returns null rather than throwing on corrupt JSON", async () => {
    await writeFile(join(dir, "pool-5.json"), "{ pas du json", "utf8");
    const store = fsStore(dir);
    await expect(store.get(5)).resolves.toBeNull();
  });

  it("returns null rather than throwing when the directory is absent", async () => {
    const store = fsStore(join(dir, "jamais-creee"));
    await expect(store.get(5)).resolves.toBeNull();
    await expect(store.latestAtOrBefore(5)).resolves.toBeNull();
  });
});

describe("fsStore — latestAtOrBefore", () => {
  it("picks the most recent snapshot at or before the day", async () => {
    const store = fsStore(dir);
    await store.put(snap(10));
    await store.put(snap(20));
    await store.put(snap(30));
    expect((await store.latestAtOrBefore(25))?.day).toBe(20);
  });

  it("counts the day itself as eligible", async () => {
    const store = fsStore(dir);
    await store.put(snap(20));
    expect((await store.latestAtOrBefore(20))?.day).toBe(20);
  });

  it("returns null when every snapshot is in the future", async () => {
    const store = fsStore(dir);
    await store.put(snap(50));
    expect(await store.latestAtOrBefore(20)).toBeNull();
  });

  it("skips a corrupt file and falls to the next older one", async () => {
    // The whole point of the fallback: one bad file costs a day of freshness,
    // not the site.
    const store = fsStore(dir);
    await store.put(snap(5));
    await writeFile(join(dir, "pool-9.json"), "{ corrompu", "utf8");
    expect((await store.latestAtOrBefore(10))?.day).toBe(5);
  });

  it("ignores files that are not day-stamped snapshots", async () => {
    const store = fsStore(dir);
    await store.put(snap(3));
    await mkdir(join(dir, "pool-99"), { recursive: true });
    for (const parasite of ["pool-abc.json", "snapshot-7.json", "pool-7.txt"]) {
      await writeFile(join(dir, parasite), "{}", "utf8");
    }
    expect((await store.latestAtOrBefore(10))?.day).toBe(3);
  });
});
