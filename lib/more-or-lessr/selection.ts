import { draw } from "@/lib/daily/deck";
import { statValue } from "./compare";
import {
  TOTAL_ROUNDS,
  type Category,
  type MorelessData,
  type Player,
} from "./types";

// Rebuilds the run so no two neighbours share a value.
//
// A tie is scored correct in BOTH directions (see `isCorrectGuess`), so a round
// between two equal values is a round the player cannot lose. With a float
// rating that never happened; with an integer count it happens constantly.
//
// Frequency-greedy: at each slot take the most common value still unplaced that
// differs from the one just placed. Taking the scarce values first strands the
// abundant one at the tail — the same trap a plain "swap in the next different
// element" pass falls into, which left an adjacent tie on 33 of 200 days.
// This ordering is optimal: it separates every value whose count is at most
// half the run, which is the most any arrangement can do.
//
// Ties inside the frequency comparison break on the lower value, so the result
// stays a pure function of the draw — same day, same run, for everyone.
//
// Best-effort by design, exactly like `applyCooldown` in lib/daily/deck.ts: if
// only one value remains it is appended rather than throwing. A pool where a
// single count fills more than half a run would be a data problem, not a draw
// problem.
function spreadTies(seq: Player[], category: Category): Player[] {
  const rest = [...seq];
  const out: Player[] = [];
  let previous: number | null = null;

  while (rest.length > 0) {
    const counts = new Map<number, number>();
    for (const p of rest) {
      const v = statValue(p, category);
      counts.set(v, (counts.get(v) ?? 0) + 1);
    }

    let pick: number | null = null;
    let picked = 0;
    for (const [value, count] of [...counts].sort((a, b) => a[0] - b[0])) {
      if (value === previous) continue;
      if (count > picked) {
        pick = value;
        picked = count;
      }
    }

    // Everything left ties with the last placed value: nothing to spread.
    if (pick === null) {
      out.push(...rest);
      break;
    }

    const index = rest.findIndex((p) => statValue(p, category) === pick);
    out.push(...rest.splice(index, 1));
    previous = pick;
  }

  return out;
}

// Deterministic player sequence for the day: same (day, category) → same order
// for everyone. The anti-repeat draw lives in lib/daily/deck, which guarantees a
// run never contains the same player twice and that two consecutive days never
// produce the same run.
export function dailySequence(
  data: MorelessData,
  day: number,
  category: Category,
): Player[] {
  const need = TOTAL_ROUNDS + 1;
  if (data.players.length < need) {
    throw new Error(
      `Pool insuffisant : ${data.players.length} joueurs, ${need} requis.`,
    );
  }
  return spreadTies(draw(data.players, `mol-${category}`, day, need), category);
}

// PRACTICE sequence: a plain random shuffle, outside the rotation.
//
// It deliberately does not go through `draw`. The daily draw walks the epoch
// chain from the origin to guarantee its gaps; at 11 players a day that is
// ~10,000 iterations for the current day, amortised by the cache. A randomly
// picked day misses the cache every time — practice froze the UI for nearly a
// second on every "Play again" click.
//
// Practice scores nothing and need not match other players: none of those
// guarantees serve it.
export function practiceSequence(
  data: MorelessData,
  category: Category,
  rand: () => number = Math.random,
): Player[] {
  const need = TOTAL_ROUNDS + 1;
  if (data.players.length < need) {
    throw new Error(
      `Pool insuffisant : ${data.players.length} joueurs, ${need} requis.`,
    );
  }
  const pool = [...data.players];
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return spreadTies(pool.slice(0, need), category);
}
