import { describe, expect, it } from "vitest";
import { cooldownSize, draw, runsPerDeck } from "./deck";

const pool = (n: number) => Array.from({ length: n }, (_, i) => `x${i}`);

// Tailles réelles des pools du projet (cf. app/data/cs2/).
const FLUX: [string, number][] = [
  ["guessr", 28],
  ["wordle-3", 42],
  ["wordle-4", 52],
  ["wordle-5", 90],
  ["wordle-6", 77],
  ["wordle-7", 44],
  ["wordle-8", 36],
];

// Écart minimal observé entre deux occurrences d'un même élément, en tirages.
function ecartMinimal(
  items: string[],
  streamId: string,
  count: number,
  jours: number,
): number {
  const vuA = new Map<string, number>();
  let min = Infinity;
  let i = 0;
  for (let day = 0; day < jours; day++) {
    for (const item of draw(items, streamId, day, count)) {
      const precedent = vuA.get(item);
      if (precedent !== undefined) min = Math.min(min, i - precedent);
      vuA.set(item, i++);
    }
  }
  return min;
}

describe("draw — garanties anti-répétition", () => {
  it.each(FLUX)(
    "%s : aucune répétition dans la fenêtre de refroidissement",
    (streamId, n) => {
      const items = pool(n);
      const c = cooldownSize(n, 1);
      expect(ecartMinimal(items, streamId, 1, 5000)).toBeGreaterThan(c);
    },
  );

  it.each(FLUX)(
    "%s : un cycle complet sort chaque élément une fois",
    (streamId, n) => {
      const items = pool(n);
      const sortis = Array.from(
        { length: n },
        (_, d) => draw(items, streamId, d, 1)[0],
      );
      expect(new Set(sortis).size).toBe(n);
    },
  );

  it("More or Lessr : jamais de doublon dans une manche de 11", () => {
    const items = pool(28);
    for (let day = 0; day < 5000; day++) {
      const manche = draw(items, "mol-rating", day, 11);
      expect(manche).toHaveLength(11);
      expect(new Set(manche).size).toBe(11);
    }
  });

  it("More or Lessr : deux manches consécutives ne sont jamais identiques", () => {
    const items = pool(28);
    let veille = draw(items, "mol-rating", 0, 11).join();
    for (let day = 1; day < 1000; day++) {
      const jour = draw(items, "mol-rating", day, 11).join();
      expect(jour).not.toBe(veille);
      veille = jour;
    }
  });
});

describe("draw — déterminisme", () => {
  it("même (flux, jour) → même tirage", () => {
    const items = pool(28);
    expect(draw(items, "guessr", 1234, 1)).toEqual(
      draw(items, "guessr", 1234, 1),
    );
  });

  it("deux flux différents divergent le même jour", () => {
    const items = pool(28);
    expect(draw(items, "mol-rating", 7, 11)).not.toEqual(
      draw(items, "mol-prize", 7, 11),
    );
  });

  it("deux jours différents divergent", () => {
    const items = pool(28);
    expect(draw(items, "guessr", 7, 1)).not.toEqual(
      draw(items, "guessr", 8, 1),
    );
  });

  it("ne dépend pas de l'ordre du pool en entrée", () => {
    // Le mélange est seedé sur (flux, époque), pas sur le contenu : deux pools
    // de même taille produisent le même MOTIF d'indices.
    const a = draw(pool(28), "guessr", 5, 1)[0];
    const b = draw(pool(28), "guessr", 5, 1)[0];
    expect(a).toBe(b);
  });
});

describe("draw — la couture entre deux époques", () => {
  // C'est le seul endroit où une carte peut revenir trop tôt : à `count = 1`,
  // la couture tombe exactement au jour `n`. On la vise directement plutôt que
  // d'espérer que la simulation générale passe dessus.
  it.each(FLUX)(
    "%s : pas de répétition de part et d'autre de la couture",
    (streamId, n) => {
      const items = pool(n);
      const c = cooldownSize(n, 1);
      for (const couture of [n, 2 * n, 3 * n]) {
        const fenetre = [];
        for (let day = couture - c; day < couture + c; day++) {
          fenetre.push(draw(items, streamId, day, 1)[0]);
        }
        expect(new Set(fenetre).size).toBe(fenetre.length);
      }
    },
  );

  it("More or Lessr : aucun joueur commun À L'INTÉRIEUR d'une époque", () => {
    // runsPerDeck = 2 : les jours pairs et impairs prennent deux moitiés
    // disjointes du même paquet. Propriété structurelle, donc exacte.
    const items = pool(28);
    for (const pair of [0, 2, 4, 100]) {
      const a = draw(items, "mol-rating", pair, 11);
      const b = draw(items, "mol-rating", pair + 1, 11);
      expect(b.filter((p) => a.includes(p))).toEqual([]);
    }
  });

  it("More or Lessr : le recouvrement à la couture reste très inférieur au hasard", () => {
    // Impossible de descendre à zéro : 11 joueurs/jour sur 28 imposent un
    // recouvrement. Le tirage purement aléatoire donnerait 11 × 11 / 28 ≈ 4,32 ;
    // on vérifie qu'on reste nettement en dessous.
    const items = pool(28);
    const recouvrements: number[] = [];
    for (let day = 1; day < 2000; day++) {
      const veille = draw(items, "mol-rating", day - 1, 11);
      const jour = draw(items, "mol-rating", day, 11);
      recouvrements.push(jour.filter((p) => veille.includes(p)).length);
    }
    const moyenne =
      recouvrements.reduce((s, v) => s + v, 0) / recouvrements.length;
    expect(moyenne).toBeLessThan(2);
  });
});

describe("draw — validation des entrées", () => {
  it("lève si le pool est plus petit que 4", () => {
    expect(() => draw(pool(3), "test", 0, 1)).toThrow(/pool/i);
  });

  it("lève si count dépasse la taille du pool", () => {
    expect(() => draw(pool(10), "test", 0, 11)).toThrow(/count/i);
  });

  it("lève si count est nul ou négatif", () => {
    expect(() => draw(pool(10), "test", 0, 0)).toThrow(/count/i);
  });
});

describe("runsPerDeck / cooldownSize", () => {
  it("runsPerDeck : 1 tirage/jour consomme le paquet entier", () => {
    expect(runsPerDeck(28, 1)).toBe(28);
  });

  it("runsPerDeck : 11 sur 28 donne 2 manches par époque", () => {
    expect(runsPerDeck(28, 11)).toBe(2);
  });

  it("cooldownSize : un quart du pool pour un tirage simple", () => {
    expect(cooldownSize(28, 1)).toBe(7);
    expect(cooldownSize(90, 1)).toBe(22);
  });

  it("cooldownSize : au moins `count` pour un tirage multiple", () => {
    expect(cooldownSize(28, 11)).toBe(11);
  });
});
