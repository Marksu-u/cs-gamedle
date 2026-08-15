// La règle de bascule quotidienne vit ici et NULLE PART ailleurs : 03:00 UTC,
// quel que soit le fuseau du joueur. Retrancher 3 h avant le `floor` suffit —
// `Date.now()` est un instant absolu, donc aucune logique de fuseau ni d'heure
// d'été n'a sa place dans ce fichier.

export const ROTATION_HOUR_UTC = 3;
export const DAY_MS = 86_400_000;
const OFFSET_MS = ROTATION_HOUR_UTC * 3_600_000;

// Numéro du jour de jeu courant. C'est LA valeur qui identifie une journée :
// tout le reste (tirage, progression, série) s'y réfère.
export function dayIndex(now: number = Date.now()): number {
  return Math.floor((now - OFFSET_MS) / DAY_MS);
}

// Millisecondes restantes avant la prochaine bascule (compte à rebours de l'accueil).
export function msUntilNextRotation(now: number = Date.now()): number {
  return (dayIndex(now) + 1) * DAY_MS + OFFSET_MS - now;
}
