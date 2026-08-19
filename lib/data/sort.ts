// Canonical ordering for every pool written to a snapshot.
//
// `buildDeck` applies its seeded permutation to the input array's ORDER, so two
// responses carrying the same players in a different order produce different
// answers for every future day — with membership completely unchanged. Sorting
// before the snapshot is written is what makes the draw depend on WHO is in the
// pool rather than on what order the upstream happened to return them in.
//
// Sorting on `name` is a placeholder for sorting on the stable Liquipedia page
// id, which the Liquipedia adapter will carry. Names change; page ids do not.

type Sortable = { name: string; id?: string };

export function canonicalise<T extends Sortable>(items: readonly T[]): T[] {
  return [...items].sort((a, b) => {
    const byName = a.name
      .toLowerCase()
      .localeCompare(b.name.toLowerCase(), "en");
    if (byName !== 0) return byName;
    // Two players with the same name is a data error, but an unstable sort on
    // top of it would be a silent one. `??` keeps the comparison total.
    return (a.id ?? "").localeCompare(b.id ?? "", "en");
  });
}
