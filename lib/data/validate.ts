// The publish gate. A snapshot that fails here is never written, so the previous
// day's snapshot stays live and a bad upstream day is invisible to players.
//
// Every problem is collected rather than thrown on the first: when this fires in
// a cron job, the log IS the diagnosis, and one error at a time means one run at
// a time.

import { canonicalise } from "./sort";
import type { Snapshot } from "./types";

export type ValidationResult = { ok: true } | { ok: false; errors: string[] };

// Floors, not targets. A pool below these is a query that broke, not a pool that
// shrank: `deck.ts` derives its cooldown from pool size, so a collapse silently
// turns the rotation into a loop.
const MIN_GUESSR = 90;
const MIN_MORELESS = 28;
const MIN_WORDLE_PER_LENGTH = 4; // `draw` throws below 4

function nombreValide(v: unknown): v is number {
  return typeof v === "number" && Number.isFinite(v);
}

export function validateSnapshot(s: Snapshot): ValidationResult {
  const errors: string[] = [];
  const push = (m: string) => errors.push(m);

  if (!Number.isInteger(s.day) || s.day < 0) push(`day invalide : ${s.day}`);

  // ---- guessr
  const g = s.guessr.players;
  if (g.length < MIN_GUESSR) {
    push(`guessr : ${g.length} joueurs, minimum ${MIN_GUESSR}`);
  }
  for (const p of g) {
    if (!p.name.trim()) push("guessr : un joueur sans nom");
    if (!p.nationality.trim()) push(`guessr : ${p.name} sans nationalité`);
    if (!p.current_team.trim()) push(`guessr : ${p.name} sans équipe`);
    if (p.role.length === 0) push(`guessr : ${p.name} sans rôle`);
    if (!nombreValide(p.age) || p.age < 15 || p.age > 45) {
      push(`guessr : ${p.name} âge hors bornes (${p.age})`);
    }
    if (!nombreValide(p.majors) || p.majors < 0) {
      push(`guessr : ${p.name} majors invalide (${p.majors})`);
    }
    if (!nombreValide(p.tournaments_won) || p.tournaments_won < 0) {
      push(
        `guessr : ${p.name} tournaments_won invalide (${p.tournaments_won})`,
      );
    }
  }
  doublons(
    g.map((p) => p.name),
    "guessr",
    push,
  );
  ordre(g, "guessr", push);

  // ---- more or lessr
  const m = s.moreless.players;
  if (m.length < MIN_MORELESS) {
    push(`moreless : ${m.length} joueurs, minimum ${MIN_MORELESS}`);
  }
  for (const p of m) {
    if (!p.name.trim()) push("moreless : un joueur sans nom");
    if (!p.team.trim()) push(`moreless : ${p.name} sans équipe`);
    if (!nombreValide(p.prize_money) || p.prize_money < 0) {
      push(`moreless : ${p.name} prize_money invalide (${p.prize_money})`);
    }
    if (!nombreValide(p.tournaments_won) || p.tournaments_won < 0) {
      push(
        `moreless : ${p.name} tournaments_won invalide (${p.tournaments_won})`,
      );
    }
  }
  doublons(
    m.map((p) => p.name),
    "moreless",
    push,
  );
  ordre(m, "moreless", push);

  // ---- wordle dictionary
  for (const [len, mots] of Object.entries(s.wordle.words)) {
    if (mots.length < MIN_WORDLE_PER_LENGTH) {
      push(`wordle : longueur ${len} n'a que ${mots.length} mots`);
    }
    for (const w of mots) {
      if (w.length !== Number(len)) {
        push(`wordle : "${w}" rangé sous la longueur ${len}`);
      }
    }
  }

  return errors.length === 0 ? { ok: true } : { ok: false, errors };
}

function doublons(noms: string[], pool: string, push: (m: string) => void) {
  const vus = new Set<string>();
  for (const n of noms) {
    const k = n.toLowerCase();
    if (vus.has(k)) push(`${pool} : nom en double « ${n} »`);
    vus.add(k);
  }
}

// The pool must already be canonicalised. Checking here rather than sorting here
// is deliberate: sorting silently would hide an adapter that forgot to, and the
// adapter is where the guarantee belongs.
function ordre<T extends { name: string }>(
  items: readonly T[],
  pool: string,
  push: (m: string) => void,
) {
  const trie = canonicalise(items);
  for (let i = 0; i < items.length; i++) {
    if (items[i].name !== trie[i].name) {
      push(`${pool} : pool not in canonical sorted order`);
      return;
    }
  }
}
