// The contracts for the daily data pipeline. Deliberately the only file both
// the adapters and the stores depend on: an adapter never knows where a
// snapshot is kept, and a store never knows where one came from.

import type { GuessrData } from "@/lib/guessr/types";
import type { MorelessData } from "@/lib/more-or-lessr/types";
import type { WordleData } from "@/lib/wordle/types";

// Everything the three games need for ONE game-day, frozen together.
//
// `day` is the `dayIndex()` this snapshot is FOR, not the day it was built:
// the sync prepares tomorrow, so the two never match. That is what lets a
// snapshot be published at any hour without changing the day in progress.
export type Snapshot = {
  day: number;
  generatedAt: string; // ISO 8601, for debugging a stale snapshot
  source: "manual" | "liquipedia";
  guessr: GuessrData;
  moreless: MorelessData;
  wordle: WordleData;
};

// Produces a snapshot for a given day. The manual implementation reads the
// committed JSON; the Liquipedia one will call the API. Neither knows what
// happens next.
export type SourceAdapter = {
  readonly name: Snapshot["source"];
  build(day: number): Promise<Snapshot>;
};

// Persists snapshots by day. Filesystem now, Vercel Blob later; the fallback
// chain in load.ts is written against this and nothing else.
export type SnapshotStore = {
  get(day: number): Promise<Snapshot | null>;
  // Most recent snapshot at or before `day`, for the "last good" fallback.
  latestAtOrBefore(day: number): Promise<Snapshot | null>;
  put(snapshot: Snapshot): Promise<void>;
};
