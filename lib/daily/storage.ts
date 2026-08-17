// Local storage access. The one rule of this file: NEVER THROW. A player in
// private browsing, with a full quota or storage disabled, must still be able to
// play — they lose persistence, not the game.

import {
  EMPTY_PERSISTED,
  STORAGE_KEY,
  STORAGE_VERSION,
  type Meta,
  type Persisted,
} from "./types";

// Validates the shape read back: a complete, numeric `meta`. Anything else falls
// back to a fresh state rather than letting `NaN` spread through the scores.
function isMeta(value: unknown): value is Meta {
  if (typeof value !== "object" || value === null) return false;
  const m = value as Record<string, unknown>;
  return (
    typeof m.streak === "number" &&
    typeof m.lastPlayedDay === "number" &&
    typeof m.runScore === "number" &&
    typeof m.recordScore === "number"
  );
}

// `puzzles` must be an object: callers index into it directly
// (`progress.puzzles[id]`). Validating `day` alone returned a shape they threw
// on — the module did not throw itself, but made everyone else throw, which
// amounts to the same thing for the player.
function parseProgress(value: unknown): Persisted["progress"] {
  if (typeof value !== "object" || value === null) return null;
  const p = value as Record<string, unknown>;
  if (typeof p.day !== "number") return null;
  if (typeof p.puzzles !== "object" || p.puzzles === null) return null;
  return p as unknown as Persisted["progress"];
}

function parse(raw: string): Persisted {
  const data = JSON.parse(raw) as Record<string, unknown>;
  if (data.version !== STORAGE_VERSION) return EMPTY_PERSISTED;
  if (!isMeta(data.meta)) return EMPTY_PERSISTED;
  return {
    version: STORAGE_VERSION,
    meta: data.meta,
    progress: parseProgress(data.progress),
  };
}

export function load(): Persisted {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return EMPTY_PERSISTED;
    return parse(raw);
  } catch {
    // Invalid JSON, blocked storage, SSR: in every case, a fresh state.
    return EMPTY_PERSISTED;
  }
}

export function save(state: Persisted): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Quota exceeded or read-only storage: carry on without persisting.
  }
}
