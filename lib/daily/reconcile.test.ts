import { describe, expect, it } from "vitest";
import { commitPuzzle, reconcile } from "./reconcile";
import { EMPTY_META, type Meta, type Persisted } from "./types";

const persisted = (
  meta: Partial<Meta>,
  progress: Persisted["progress"] = null,
): Persisted => ({
  version: 1,
  meta: { ...EMPTY_META, ...meta },
  progress,
});

describe("reconcile — la série", () => {
  it("laisse tout en place si on a déjà joué aujourd'hui", () => {
    const avant = persisted({ streak: 5, lastPlayedDay: 100, runScore: 900 });
    expect(reconcile(avant, 100).meta).toEqual(avant.meta);
  });

  it("laisse la série intacte au lendemain, avant d'avoir joué", () => {
    const apres = reconcile(
      persisted({ streak: 5, lastPlayedDay: 100, runScore: 900 }),
      101,
    );
    expect(apres.meta.streak).toBe(5);
    expect(apres.meta.runScore).toBe(900);
  });

  it("casse la série et le score courant si un jour est manqué", () => {
    const apres = reconcile(
      persisted({ streak: 5, lastPlayedDay: 100, runScore: 900 }),
      102,
    );
    expect(apres.meta.streak).toBe(0);
    expect(apres.meta.runScore).toBe(0);
  });

  it("préserve le record quand la série casse", () => {
    const apres = reconcile(
      persisted({
        streak: 5,
        lastPlayedDay: 100,
        runScore: 900,
        recordScore: 900,
      }),
      102,
    );
    expect(apres.meta.recordScore).toBe(900);
  });

  it("supporte une absence de plusieurs mois", () => {
    const apres = reconcile(
      persisted({
        streak: 40,
        lastPlayedDay: 100,
        runScore: 50000,
        recordScore: 50000,
      }),
      500,
    );
    expect(apres.meta).toEqual({
      streak: 0,
      lastPlayedDay: 100,
      runScore: 0,
      recordScore: 50000,
    });
  });

  it("ne casse rien pour un joueur qui n'a jamais joué", () => {
    expect(reconcile(persisted({}), 100).meta).toEqual(EMPTY_META);
  });
});

describe("reconcile — la progression du jour", () => {
  it("jette la progression d'un jour révolu", () => {
    const apres = reconcile(
      persisted(
        { lastPlayedDay: 100 },
        {
          day: 100,
          puzzles: { guessr: { status: "won", points: 200, state: null } },
        },
      ),
      101,
    );
    expect(apres.progress).toBeNull();
  });

  it("garde la progression du jour courant", () => {
    const progress = {
      day: 101,
      puzzles: { guessr: { status: "won" as const, points: 200, state: null } },
    };
    expect(
      reconcile(persisted({ lastPlayedDay: 101 }, progress), 101).progress,
    ).toEqual(progress);
  });
});

describe("commitPuzzle", () => {
  it("démarre une série à 1 au tout premier résultat", () => {
    const apres = commitPuzzle(persisted({}), 100, "guessr", {
      status: "won",
      points: 200,
      state: null,
    });
    expect(apres.meta.streak).toBe(1);
    expect(apres.meta.lastPlayedDay).toBe(100);
  });

  it("applique ×1 au premier jour d'une série", () => {
    const apres = commitPuzzle(persisted({}), 100, "guessr", {
      status: "won",
      points: 200,
      state: null,
    });
    expect(apres.meta.runScore).toBe(200);
  });

  it("incrémente la série si la veille a été jouée", () => {
    const apres = commitPuzzle(
      persisted({ streak: 6, lastPlayedDay: 99 }),
      100,
      "guessr",
      { status: "won", points: 200, state: null },
    );
    expect(apres.meta.streak).toBe(7);
    // Série de 7 → ×1.5
    expect(apres.meta.runScore).toBe(300);
  });

  it("fige le multiplicateur pour les grilles suivantes du même jour", () => {
    let etat = commitPuzzle(
      persisted({ streak: 6, lastPlayedDay: 99 }),
      100,
      "guessr",
      {
        status: "won",
        points: 200,
        state: null,
      },
    );
    etat = commitPuzzle(etat, 100, "wordle-5", {
      status: "won",
      points: 100,
      state: null,
    });
    expect(etat.meta.streak).toBe(7); // la série ne rebouge pas dans la journée
    expect(etat.meta.runScore).toBe(300 + 150); // ×1.5 sur les deux
  });

  it("compte la journée même si la grille est perdue", () => {
    const apres = commitPuzzle(persisted({}), 100, "guessr", {
      status: "lost",
      points: 0,
      state: null,
    });
    expect(apres.meta.streak).toBe(1);
    expect(apres.meta.runScore).toBe(0);
  });

  it("met le record à jour au fil de l'eau", () => {
    const apres = commitPuzzle(persisted({ recordScore: 100 }), 100, "guessr", {
      status: "won",
      points: 200,
      state: null,
    });
    expect(apres.meta.recordScore).toBe(200);
  });

  it("ne baisse jamais le record", () => {
    const apres = commitPuzzle(
      persisted({ recordScore: 5000 }),
      100,
      "guessr",
      {
        status: "won",
        points: 200,
        state: null,
      },
    );
    expect(apres.meta.recordScore).toBe(5000);
  });

  it("enregistre la progression de la grille", () => {
    const apres = commitPuzzle(persisted({}), 100, "wordle-5", {
      status: "won",
      points: 134,
      state: { guesses: ["ZYWOO"] },
    });
    expect(apres.progress).toEqual({
      day: 100,
      puzzles: {
        "wordle-5": {
          status: "won",
          points: 134,
          state: { guesses: ["ZYWOO"] },
        },
      },
    });
  });

  it("ne recompte pas une grille déjà terminée le même jour", () => {
    let etat = commitPuzzle(persisted({}), 100, "guessr", {
      status: "won",
      points: 200,
      state: null,
    });
    const scoreApresPremier = etat.meta.runScore;
    etat = commitPuzzle(etat, 100, "guessr", {
      status: "won",
      points: 200,
      state: null,
    });
    expect(etat.meta.runScore).toBe(scoreApresPremier);
  });

  it("ignore un résultat dont le jour ne correspond plus", () => {
    // Partie TIRÉE au jour 100, terminée après la bascule (on est au jour 101) :
    // elle ne doit ni créditer la nouvelle journée ni prolonger la série.
    const avant = persisted(
      { streak: 5, lastPlayedDay: 100, runScore: 900 },
      { day: 100, puzzles: {} },
    );
    const apres = commitPuzzle(
      avant,
      101, // jour courant
      "guessr",
      { status: "won", points: 200, state: null },
      100, // jour du tirage
    );
    expect(apres.meta).toEqual(avant.meta);
    expect(apres.progress).toBeNull();
  });
});
