// The fallback chain itself, kept free of `server-only` and of any store so the
// tests can drive it directly. `loadSnapshot` in ./load.server.ts is what pages
// call; this is the logic it wraps.
//
// Chain, in order: today's snapshot → the most recent earlier one → the JSON
// committed to the repo. Every link is validated before it is served, because a
// snapshot that parses is not the same as a snapshot that is right.

import { manualAdapter } from "./adapters/manual";
import { validateSnapshot } from "./validate";
import type { Snapshot, SnapshotStore } from "./types";

async function utilisable(
  lire: () => Promise<Snapshot | null>,
): Promise<Snapshot | null> {
  try {
    const s = await lire();
    if (!s) return null;
    return validateSnapshot(s).ok ? s : null;
  } catch {
    // A store that throws is a store that is down. Fall through; never surface.
    return null;
  }
}

// Injectable store and day, so the chain is testable without a filesystem.
export async function loadSnapshotFrom(
  store: SnapshotStore,
  day: number,
): Promise<Snapshot> {
  const aujourdhui = await utilisable(() => store.get(day));
  if (aujourdhui) return aujourdhui;

  const dernier = await utilisable(() => store.latestAtOrBefore(day));
  if (dernier) return dernier;

  return manualAdapter.build(day);
}
