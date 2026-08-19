// Filesystem store: what `npm run sync` writes to locally, and what makes the
// pipeline exercisable end to end before Vercel Blob exists. The Blob store
// implements the same three methods and replaces this one by configuration.
//
// NEVER THROWS on a read, for the same reason lib/daily/storage.ts does not: a
// missing or unreadable snapshot must fall through the chain, not take the page
// down.

import { readFile, readdir, writeFile, mkdir } from "node:fs/promises";
import { join } from "node:path";
import type { Snapshot, SnapshotStore } from "../types";

const DIR = join(process.cwd(), ".snapshots");
const nom = (day: number) => `pool-${day}.json`;

export function fsStore(dir: string = DIR): SnapshotStore {
  return {
    async get(day) {
      try {
        return JSON.parse(
          await readFile(join(dir, nom(day)), "utf8"),
        ) as Snapshot;
      } catch {
        return null;
      }
    },
    async latestAtOrBefore(day) {
      try {
        const jours = (await readdir(dir))
          .map((f) => /^pool-(\d+)\.json$/.exec(f)?.[1])
          .filter((d): d is string => d !== undefined)
          .map(Number)
          .filter((d) => d <= day)
          .sort((a, b) => b - a);
        for (const d of jours) {
          const s = await this.get(d);
          if (s) return s;
        }
        return null;
      } catch {
        return null;
      }
    },
    async put(snapshot) {
      await mkdir(dir, { recursive: true });
      await writeFile(
        join(dir, nom(snapshot.day)),
        JSON.stringify(snapshot, null, 2) + "\n",
        "utf8",
      );
    },
  };
}
