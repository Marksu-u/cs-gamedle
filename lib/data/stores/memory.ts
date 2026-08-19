// In-memory store: tests, and the default when nothing else is configured.
// Deliberately trivial — the fallback chain is what is under test, not this.

import type { Snapshot, SnapshotStore } from "../types";

export function memoryStore(seed: Snapshot[] = []): SnapshotStore {
  const byDay = new Map<number, Snapshot>(seed.map((s) => [s.day, s]));
  return {
    async get(day) {
      return byDay.get(day) ?? null;
    },
    async latestAtOrBefore(day) {
      const jours = [...byDay.keys()]
        .filter((d) => d <= day)
        .sort((a, b) => b - a);
      return jours.length > 0 ? (byDay.get(jours[0]) ?? null) : null;
    },
    async put(snapshot) {
      byDay.set(snapshot.day, snapshot);
    },
  };
}
