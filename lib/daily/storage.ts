// Accès au stockage local. Règle unique de ce fichier : NE JAMAIS LEVER.
// Un joueur en navigation privée, avec un quota plein ou un stockage désactivé
// doit pouvoir jouer — il perd la persistance, pas le jeu.

import {
  EMPTY_PERSISTED,
  STORAGE_KEY,
  STORAGE_VERSION,
  type Meta,
  type Persisted,
} from "./types";

// Valide la forme relue : un `meta` complet et numérique. Tout écart renvoie
// vers un état neuf plutôt que de propager des `NaN` dans les scores.
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

// `puzzles` doit être un objet : les appelants y indexent directement
// (`progress.puzzles[id]`). Valider `day` seul rendait une forme sur laquelle
// ils levaient — le module ne levait pas lui-même, mais faisait lever les
// autres, ce qui revient au même pour le joueur.
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
    // JSON invalide, stockage bloqué, SSR : dans tous les cas, état neuf.
    return EMPTY_PERSISTED;
  }
}

export function save(state: Persisted): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Quota dépassé ou stockage en lecture seule : on continue sans persister.
  }
}
