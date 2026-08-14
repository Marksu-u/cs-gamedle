import { afterEach, describe, expect, it, vi } from "vitest";
import {
  createInitialState,
  createWordleReducer,
  hintCandidates,
} from "./reducer";
import { evaluateGuess } from "@/lib/wordle/engine";
import type { BoardState, WordleData, WordleState } from "@/lib/wordle/types";

const data: WordleData = {
  game: "test",
  words: { "3": ["CAT", "DOG", "BAT"], "4": ["ROPZ", "DONK"] },
};
const reducer = createWordleReducer(data);

function board(target: string, over: Partial<BoardState> = {}): BoardState {
  return {
    target,
    length: target.length,
    guesses: [],
    evaluations: [],
    current: "",
    status: "playing",
    invalid: false,
    hintedChars: [],
    ...over,
  };
}
function stateOf(b: BoardState): WordleState {
  return { activeLength: b.length, boards: { [b.length]: b } };
}

describe("createInitialState", () => {
  it("crée le board de la longueur par défaut", () => {
    const s = createInitialState(data, 4);
    expect(s.activeLength).toBe(4);
    expect(s.boards[4].status).toBe("playing");
    expect(data.words["4"]).toContain(s.boards[4].target);
  });
});

describe("reducer", () => {
  it("KEY_INPUT ajoute le caractère en majuscule", () => {
    const s = reducer(stateOf(board("CAT")), { type: "KEY_INPUT", char: "c" });
    expect(s.boards[3].current).toBe("C");
  });

  it("KEY_INPUT ignoré quand la saisie est pleine", () => {
    const s = reducer(stateOf(board("CAT", { current: "DOG" })), {
      type: "KEY_INPUT",
      char: "X",
    });
    expect(s.boards[3].current).toBe("DOG");
  });

  it("KEY_INPUT ignoré quand la partie est finie", () => {
    const s = reducer(stateOf(board("CAT", { status: "won" })), {
      type: "KEY_INPUT",
      char: "X",
    });
    expect(s.boards[3].current).toBe("");
  });

  it("DELETE retire le dernier caractère", () => {
    const s = reducer(stateOf(board("CAT", { current: "CA" })), {
      type: "DELETE",
    });
    expect(s.boards[3].current).toBe("C");
  });

  it("SUBMIT incomplet → invalid, aucun essai consommé", () => {
    const s = reducer(stateOf(board("CAT", { current: "CA" })), {
      type: "SUBMIT",
    });
    expect(s.boards[3].invalid).toBe(true);
    expect(s.boards[3].guesses).toHaveLength(0);
  });

  it("SUBMIT mot inconnu → invalid", () => {
    const s = reducer(stateOf(board("CAT", { current: "XYZ" })), {
      type: "SUBMIT",
    });
    expect(s.boards[3].invalid).toBe(true);
    expect(s.boards[3].guesses).toHaveLength(0);
  });

  it("SUBMIT correct → won", () => {
    const s = reducer(stateOf(board("CAT", { current: "CAT" })), {
      type: "SUBMIT",
    });
    expect(s.boards[3].status).toBe("won");
    expect(s.boards[3].guesses).toEqual(["CAT"]);
    expect(s.boards[3].current).toBe("");
  });

  it("SUBMIT valide mais faux (pas le 6e) → playing", () => {
    const s = reducer(stateOf(board("CAT", { current: "DOG" })), {
      type: "SUBMIT",
    });
    expect(s.boards[3].status).toBe("playing");
    expect(s.boards[3].guesses).toHaveLength(1);
  });

  it("SUBMIT du 6e essai faux → lost", () => {
    const prior = ["DOG", "BAT", "DOG", "BAT", "DOG"];
    const start = stateOf(
      board("CAT", {
        current: "BAT",
        guesses: prior,
        evaluations: prior.map((g) => evaluateGuess(g, "CAT")),
      }),
    );
    const s = reducer(start, { type: "SUBMIT" });
    expect(s.boards[3].status).toBe("lost");
    expect(s.boards[3].guesses).toHaveLength(6);
  });

  it("SELECT_LENGTH crée le board manquant et conserve l'existant", () => {
    const start: WordleState = {
      activeLength: 3,
      boards: { 3: board("CAT", { current: "CA" }) },
    };
    const s = reducer(start, { type: "SELECT_LENGTH", length: 4 });
    expect(s.activeLength).toBe(4);
    expect(s.boards[4].status).toBe("playing");
    expect(data.words["4"]).toContain(s.boards[4].target);
    expect(s.boards[3].current).toBe("CA");
  });

  it("SELECT_LENGTH vers un board existant ne le recrée pas", () => {
    const start: WordleState = {
      activeLength: 4,
      boards: { 3: board("CAT", { current: "CA" }), 4: board("ROPZ") },
    };
    const s = reducer(start, { type: "SELECT_LENGTH", length: 3 });
    expect(s.boards[3].target).toBe("CAT");
    expect(s.boards[3].current).toBe("CA");
  });

  it("REPLAY réinitialise le board avec un nouveau mot", () => {
    const start = stateOf(
      board("CAT", {
        guesses: ["CAT"],
        evaluations: [evaluateGuess("CAT", "CAT")],
        status: "won",
        hintedChars: ["C"],
      }),
    );
    const s = reducer(start, { type: "REPLAY" });
    expect(s.boards[3].status).toBe("playing");
    expect(s.boards[3].guesses).toHaveLength(0);
    expect(s.boards[3].current).toBe("");
    expect(s.boards[3].hintedChars).toEqual([]);
    expect(data.words["3"]).toContain(s.boards[3].target);
  });

  it("CLEAR_INVALID remet le flag à false", () => {
    const s = reducer(stateOf(board("CAT", { invalid: true })), {
      type: "CLEAR_INVALID",
    });
    expect(s.boards[3].invalid).toBe(false);
  });

  it("SELECT_LENGTH : le board créé démarre avec hintedChars vide", () => {
    const start: WordleState = {
      activeLength: 3,
      boards: { 3: board("CAT") },
    };
    const s = reducer(start, { type: "SELECT_LENGTH", length: 4 });
    expect(s.boards[4].hintedChars).toEqual([]);
  });
});

describe("hintCandidates", () => {
  it("exclut les caractères déjà present/correct au clavier et déjà indicés", () => {
    // Essai DOG contre CAT : rien de la cible n'est révélé (D,O,G absents).
    // On indice C. Restent alors A et T comme candidats (C exclu car indicé).
    const b = board("CAT", { hintedChars: ["C"] });
    expect(hintCandidates(b).sort()).toEqual(["A", "T"]);
  });

  it("exclut un caractère révélé present/correct par un essai", () => {
    // Essai BAT contre CAT : A et T révélés (A present/correct, T correct).
    // Seul C reste caché.
    const b = board("CAT", {
      guesses: ["BAT"],
      evaluations: [evaluateGuess("BAT", "CAT")],
    });
    expect(hintCandidates(b)).toEqual(["C"]);
  });
});

describe("reducer HINT / GIVE_UP", () => {
  afterEach(() => vi.restoreAllMocks());

  it("HINT ajoute un caractère caché de la cible sans consommer d'essai", () => {
    const start = stateOf(board("CAT"));
    const s = reducer(start, { type: "HINT" });
    expect(s.boards[3].hintedChars).toHaveLength(1);
    expect(["C", "A", "T"]).toContain(s.boards[3].hintedChars[0]);
    expect(s.boards[3].guesses).toHaveLength(0);
    expect(s.boards[3].current).toBe("");
  });

  it("HINT ne duplique jamais un caractère déjà indicé", () => {
    // C déjà indicé ; on force le tirage sur le premier candidat restant.
    vi.spyOn(Math, "random").mockReturnValue(0);
    const start = stateOf(board("CAT", { hintedChars: ["C"] }));
    const s = reducer(start, { type: "HINT" });
    // C reste dans la liste (déjà indicé), un nouveau caractère est ajouté,
    // et aucun doublon n'apparaît.
    expect(s.boards[3].hintedChars).toContain("C");
    expect(s.boards[3].hintedChars).toHaveLength(2);
    expect(new Set(s.boards[3].hintedChars).size).toBe(
      s.boards[3].hintedChars.length,
    );
  });

  it("HINT no-op quand tous les candidats sont épuisés", () => {
    const start = stateOf(board("CAT", { hintedChars: ["C", "A", "T"] }));
    const s = reducer(start, { type: "HINT" });
    expect(s).toBe(start);
  });

  it("HINT no-op quand la partie n'est pas en cours", () => {
    const start = stateOf(board("CAT", { status: "won" }));
    const s = reducer(start, { type: "HINT" });
    expect(s).toBe(start);
  });

  it("GIVE_UP passe le board en lost", () => {
    const start = stateOf(board("CAT"));
    const s = reducer(start, { type: "GIVE_UP" });
    expect(s.boards[3].status).toBe("lost");
  });

  it("GIVE_UP no-op si la partie est déjà terminée", () => {
    const start = stateOf(board("CAT", { status: "won" }));
    const s = reducer(start, { type: "GIVE_UP" });
    expect(s).toBe(start);
  });
});
