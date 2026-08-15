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
      const ecart = ecartMinimal(items, streamId, 1, 2000);
      // Garde-fou : sans répétition du tout, `ecartMinimal` rendrait Infinity et
      // l'assertion suivante passerait sans rien prouver.
      expect(ecart).toBeLessThan(Infinity);
      expect(ecart).toBeGreaterThan(c);
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

  it.each(FLUX)(
    "%s : la couverture tient aussi hors de l'époque 0",
    (streamId, n) => {
      // Le test précédent ne couvre que les jours 0..n-1, soit l'époque 0, la
      // seule qui ne passe jamais par `applyCooldown`.
      const items = pool(n);
      const sortis = Array.from(
        { length: n },
        (_, d) => draw(items, streamId, 3 * n + d, 1)[0],
      );
      expect(new Set(sortis).size).toBe(n);
    },
  );

  it("More or Lessr : jamais de doublon dans une manche de 11", () => {
    const items = pool(28);
    for (let day = 0; day < 2000; day++) {
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

describe("draw — écart réel en JOURS (ce que le joueur ressent)", () => {
  // `cooldown` se compte en TIRAGES. À `count = 1` un tirage vaut une journée,
  // mais More or Lessr en consomme 11 par jour : l'écart y est bien plus court
  // en jours. La doc a déjà affirmé « ⌊pool/4⌋ jours » pour tout le monde ;
  // c'était faux pour les deux flux MoL. Ces valeurs le figent.
  function ecartMinJours(
    items: string[],
    streamId: string,
    count: number,
    jours: number,
  ): number {
    const vu = new Map<string, number>();
    let min = Infinity;
    for (let day = 0; day < jours; day++) {
      for (const item of draw(items, streamId, day, count)) {
        const precedent = vu.get(item);
        if (precedent !== undefined) min = Math.min(min, day - precedent);
        vu.set(item, day);
      }
    }
    return min;
  }

  it.each(FLUX)(
    "%s : une cible ne revient pas avant ⌊pool/4⌋ JOURS",
    (streamId, n) => {
      expect(ecartMinJours(pool(n), streamId, 1, 2000)).toBeGreaterThan(
        cooldownSize(n, 1),
      );
    },
  );

  it("More or Lessr : l'écart est de 2 jours, pas de 7", () => {
    // 11 joueurs par jour : les 12 tirages d'écart tiennent dans ~1 jour. Ce
    // n'est pas un défaut, c'est l'unité qui change — mais il ne faut pas le
    // documenter comme 7 jours.
    expect(ecartMinJours(pool(28), "mol-rating", 11, 2000)).toBe(2);
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

  it("dépend de la position dans le pool, pas du contenu", () => {
    // Le mélange est seedé sur (flux, époque) : il choisit un INDICE. Un pool
    // inversé doit donc rendre l'élément symétrique, pas le même.
    const n = 28;
    const direct = draw(pool(n), "guessr", 5, 1)[0];
    const inverse = draw([...pool(n)].reverse(), "guessr", 5, 1)[0];
    const indice = Number(direct.slice(1));
    expect(inverse).toBe(`x${n - 1 - indice}`);
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

  it("More or Lessr : aucun joueur commun À LA COUTURE non plus", () => {
    // La couture tombe entre un jour impair et le jour pair suivant. C'est le
    // cas que le raccourci « lire le mélange brut » ratait : il laissait passer
    // 2,8 joueurs en commun en moyenne. On mesure la couture SEULE — la moyenne
    // sur toutes les transitions serait diluée de moitié par les zéros internes.
    const items = pool(28);
    const coutures: number[] = [];
    for (let day = 1; day < 2000; day += 2) {
      const veille = draw(items, "mol-rating", day, 11);
      const lendemain = draw(items, "mol-rating", day + 1, 11);
      coutures.push(lendemain.filter((p) => veille.includes(p)).length);
    }
    expect(coutures.length).toBeGreaterThan(900);
    expect(Math.max(...coutures)).toBe(0);
  });

  it("More or Lessr : un joueur ne revient pas avant 11 tirages", () => {
    const items = pool(28);
    const ecart = ecartMinimal(items, "mol-rating", 11, 1000);
    expect(ecart).toBeLessThan(Infinity);
    expect(ecart).toBeGreaterThanOrEqual(11);
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

  it("lève si count n'est pas entier", () => {
    expect(() => draw(pool(10), "test", 0, 1.5)).toThrow(/count/i);
  });

  it("lève sur un jour négatif plutôt que de rendre une tranche vide", () => {
    // Sans ce garde-fou, `slot` devient négatif et `slice` rend [] ou une
    // tranche décalée : une grille vide livrée à tous, sans erreur.
    expect(() => draw(pool(28), "guessr", -1, 1)).toThrow(/day/i);
    expect(() => draw(pool(28), "mol-rating", -2, 11)).toThrow(/day/i);
  });

  it("lève sur un jour non entier ou non fini", () => {
    expect(() => draw(pool(28), "guessr", 1.5, 1)).toThrow(/day/i);
    expect(() => draw(pool(28), "guessr", NaN, 1)).toThrow(/day/i);
    expect(() => draw(pool(28), "guessr", Infinity, 1)).toThrow(/day/i);
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
