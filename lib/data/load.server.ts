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
import { SNAPSHOT_REVALIDATE, SNAPSHOT_TAG } from "./cache";
import { loadSnapshotFrom } from "./load";
import { fsStore } from "./stores/fs";
import type { Snapshot } from "./types";

export { SNAPSHOT_REVALIDATE, SNAPSHOT_TAG };

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
