// Cache identity for the snapshot read, in its own file so a test can import it
// without dragging in `server-only` (which throws the moment a test touches it).

// The tag every snapshot read is filed under. Once the cron route exists it
// calls `revalidateTag(SNAPSHOT_TAG)` straight after a successful write, which
// drops both the cache entry AND the rendered pages that consumed it — the
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
//
// Each game page repeats this number as a literal `export const revalidate`,
// because Next only accepts a statically analysable value there. `cache.test.ts`
// is what keeps the two from drifting apart.
export const SNAPSHOT_REVALIDATE = 900;
