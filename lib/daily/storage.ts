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

function parse(raw: string): Persisted {
  const data = JSON.parse(raw) as Record<string, unknown>;
  if (data.version !== STORAGE_VERSION) return EMPTY_PERSISTED;
  if (!isMeta(data.meta)) return EMPTY_PERSISTED;
  const progress =
    typeof data.progress === "object" &&
    data.progress !== null &&
    typeof (data.progress as Record<string, unknown>).day === "number"
      ? (data.progress as Persisted["progress"])
      : null;
  return { version: STORAGE_VERSION, meta: data.meta, progress };
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
