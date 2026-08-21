import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { SNAPSHOT_REVALIDATE, SNAPSHOT_TAG } from "./cache";

// Next only accepts a statically analysable literal for a route segment's
// `revalidate`, so the number cannot be imported into the pages — it is written
// out three times. Nothing but this test stops those copies from drifting away
// from the value the cache entry itself uses, and a page revalidating on a
// different clock than its data is exactly the bug that would be missed by hand.
const PAGES = [
  "app/[locale]/guessr/page.tsx",
  "app/[locale]/more-or-lessr/page.tsx",
  "app/[locale]/wordle/page.tsx",
];

describe("snapshot cache settings", () => {
  it.each(PAGES)("%s revalidates on the shared window", async (page) => {
    const source = await readFile(join(process.cwd(), page), "utf8");
    const match = /export const revalidate = (\d+);/.exec(source);
    expect(match, `${page} declares no revalidate`).not.toBeNull();
    expect(Number(match?.[1])).toBe(SNAPSHOT_REVALIDATE);
  });

  it("keeps the window long enough to be worth caching, short enough to matter", () => {
    // A floor because a near-zero window makes prerendering pointless; a ceiling
    // because the cron's whole job is a daily refresh, and a window measured in
    // hours would swallow it whole.
    expect(SNAPSHOT_REVALIDATE).toBeGreaterThanOrEqual(60);
    expect(SNAPSHOT_REVALIDATE).toBeLessThanOrEqual(3600);
  });

  it("exposes a stable tag for the cron route to invalidate", () => {
    expect(SNAPSHOT_TAG).toBe("snapshot");
  });
});
