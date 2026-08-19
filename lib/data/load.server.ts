// The only entry point pages use. Everything above it is swappable; this file is
// the promise that a page always gets usable data.
//
// Chain, in order: today's snapshot → the most recent earlier one → the JSON
// committed to the repo. Every link is validated before it is served, because a
// snapshot that parses is not the same as a snapshot that is right.
//
// Split from ./load.ts so the chain stays testable: `server-only` throws the
// moment a test imports it, and the chain is the part worth testing.

import "server-only";
import { unstable_cache } from "next/cache";
import { dayIndex } from "@/lib/daily/clock";
import { loadSnapshotFrom } from "./load";
import { fsStore } from "./stores/fs";
import type { Snapshot } from "./types";

// The tag every snapshot read is filed under. Once the cron route exists it
// calls `revalidateTag(SNAPSHOT_TAG)` straight after a successful write, which
// drops both this cache entry AND the rendered pages that consumed it — the
// difference between "the new pool is live now" and "within the window below".
export const SNAPSHOT_TAG = "snapshot";

// How long a rendered page may keep serving the pool it was built with.
//
// The three game pages are prerendered, so without this the pool is frozen at
// BUILD time and a snapshot written afterwards is never served. Fifteen minutes
// is the ceiling on that staleness if nothing invalidates the tag; a working
// cron makes it zero.
//
// Staleness here is mild by construction: the pool is the cast of players, and
// the day is computed in the browser (`useDay`), so the answers still rotate at
// 03:00 UTC on the dot. A late pool means a player who joined the roster
// yesterday might not appear for another quarter of an hour — invisible, and
// the same trade the fallback chain already makes.
export const SNAPSHOT_REVALIDATE = 900;

// `day` is part of the cache key, so the rotation is a miss rather than a hit on
// yesterday's entry: the first render after 03:00 reads the store afresh.
const lire = unstable_cache(
  (day: number) => loadSnapshotFrom(fsStore(), day),
  ["snapshot"],
  { tags: [SNAPSHOT_TAG], revalidate: SNAPSHOT_REVALIDATE },
);

// What pages call. Reads the clock and the configured store.
export function loadSnapshot(): Promise<Snapshot> {
  return lire(dayIndex());
}
