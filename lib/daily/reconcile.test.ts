import { describe, expect, it } from "vitest";
import { commitPuzzle, reconcile, saveProgress } from "./reconcile";
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

  it("écarte le résultat périmé SANS effacer la journée en cours", () => {
    // Le piège : rendre `progress: null` sans condition efface les grilles
    // déjà terminées aujourd'hui, qui redeviennent alors marquables. Le score
    // du jour serait compté deux fois.
    let etat = commitPuzzle(
      persisted({ streak: 5, lastPlayedDay: 100, runScore: 900 }),
      101,
      "guessr",
      { status: "won", points: 200, state: null },
    );
    const scoreApresGuessr = etat.meta.runScore;

    // Une partie tirée la veille se termine maintenant : elle ne compte pas...
    etat = commitPuzzle(
      etat,
      101,
      "wordle-5",
      { status: "won", points: 300, state: null },
      100,
    );
    expect(etat.meta.runScore).toBe(scoreApresGuessr);
    // ...et ne doit pas avoir effacé le Guessr déjà terminé aujourd'hui.
    expect(etat.progress?.puzzles.guessr?.status).toBe("won");

    // Donc rejouer le Guessr ne rapporte toujours rien.
    etat = commitPuzzle(etat, 101, "guessr", {
      status: "won",
      points: 200,
      state: null,
    });
    expect(etat.meta.runScore).toBe(scoreApresGuessr);
  });
});

describe("saveProgress", () => {
  it("enregistre l'avancement sans toucher à la série ni au score", () => {
    const avant = persisted({ streak: 4, lastPlayedDay: 100, runScore: 900 });
    const apres = saveProgress(avant, 100, "wordle-5", { guesses: ["ZYWOO"] });
    expect(apres.meta).toEqual(avant.meta);
    expect(apres.progress?.puzzles["wordle-5"]).toEqual({
      status: "playing",
      points: 0,
      state: { guesses: ["ZYWOO"] },
    });
  });

  it("une grille sauvegardée puis terminée rapporte bien ses points", () => {
    // Sans cette assertion, restreindre le test « déjà terminée » au seul
    // `status !== undefined` passerait inaperçu — et TOUTE grille reprise
    // après un rafraîchissement vaudrait alors zéro.
    let etat = saveProgress(persisted({}), 100, "wordle-5", {
      guesses: ["ZYWOO"],
    });
    etat = commitPuzzle(etat, 100, "wordle-5", {
      status: "won",
      points: 134,
      state: { guesses: ["ZYWOO"] },
    });
    expect(etat.meta.runScore).toBe(134);
    expect(etat.meta.streak).toBe(1);
  });

  it("ne réécrit pas par-dessus une grille déjà terminée", () => {
    let etat = commitPuzzle(persisted({}), 100, "guessr", {
      status: "won",
      points: 200,
      state: { rows: ["final"] },
    });
    etat = saveProgress(etat, 100, "guessr", { rows: ["écrasé"] });
    expect(etat.progress?.puzzles.guessr?.status).toBe("won");
    expect(etat.progress?.puzzles.guessr?.points).toBe(200);
  });

  it("ne ressuscite pas l'état d'une partie de la veille", () => {
    // Onglet ouvert avant la bascule qui sauvegarde après : l'état de la veille
    // ne doit pas être réécrit sous la date du jour, sinon la grille du
    // lendemain reprend avec les essais d'hier.
    const avant = persisted(
      { lastPlayedDay: 100 },
      {
        day: 100,
        puzzles: {
          "wordle-5": {
            status: "playing",
            points: 0,
            state: { guesses: ["HIER"] },
          },
        },
      },
    );
    const apres = saveProgress(
      avant,
      101,
      "wordle-5",
      { guesses: ["HIER", "ENCORE"] },
      100, // tirée au jour 100
    );
    expect(apres.progress).toBeNull();
  });
});

describe("reconcile — horloge reculée", () => {
  it("traite un dernier jour joué dans le futur comme une rupture", () => {
    // Le joueur recule l'horloge de sa machine : sans ce garde-fou, la série
    // resterait accrochée à un score qu'elle ne peut plus justifier.
    const apres = reconcile(
      persisted({
        streak: 9,
        lastPlayedDay: 200,
        runScore: 9200,
        recordScore: 9200,
      }),
      100,
    );
    expect(apres.meta.streak).toBe(0);
    expect(apres.meta.runScore).toBe(0);
    expect(apres.meta.recordScore).toBe(9200);
  });
});
