import { afterEach, describe, expect, it, vi } from "vitest";
import {
  createInitialState,
  createWordleReducer,
  hintCandidates,
} from "./reducer";
import { evaluateGuess } from "@/lib/wordle/engine";
import { MAX_HINTS } from "@/lib/wordle/types";
import type { BoardState, WordleData, WordleState } from "@/lib/wordle/types";

// Chaque groupe a au moins 4 mots : `draw` (lib/daily/deck) exige pool >= 4.
const data: WordleData = {
  game: "test",
  words: {
    "3": ["CAT", "DOG", "BAT", "RAT"],
    "4": ["ROPZ", "DONK", "NIKO", "COBY"],
    "5": ["APPLE", "MANGO", "LEMON", "GRAPE"],
    "6": ["ORANGE", "YELLOW", "PURPLE", "SILVER"],
  },
};
const DAY = 100;

// Slots 0 and 1 are BOTH three characters: the collision the slot-keyed refactor
// exists to fix. Every tag is in `data.words` for its length, so each one is
// typable — the same thing `dailyTags` guarantees by drawing from the dictionary.
const tags = ["CAT", "DOG", "ROPZ", "APPLE", "ORANGE"];
const reducer = createWordleReducer(data, DAY);

function board(
  target: string,
  slot: number,
  over: Partial<BoardState> = {},
): BoardState {
  return {
    target,
    slot,
    length: target.length,
    guesses: [],
    evaluations: [],
    current: "",
    status: "playing",
    invalid: false,
    hintedChars: [],
    mode: "daily",
    day: DAY,
    ...over,
  };
}
// The board under test installed at its slot, among the day's five boards.
function stateOf(b: BoardState): WordleState {
  const state = createInitialState(tags, DAY);
  const boards = [...state.boards];
  boards[b.slot] = b;
  return { ...state, activeSlot: b.slot, boards };
}

describe("createInitialState", () => {
  it("crée un board par pseudo du jour, dans l'ordre du tirage", () => {
    const s = createInitialState(tags, DAY);
    expect(s.activeSlot).toBe(0);
    expect(s.boards.map((b) => b.target)).toEqual(tags);
    expect(s.boards.every((b) => b.status === "playing")).toBe(true);
    expect(s.boards.every((b, i) => b.slot === i)).toBe(true);
  });

  it("garde deux postes de même longueur en boards séparés", () => {
    // `apEX` and `ropz` are both four characters. Under the old
    // `Record<number, BoardState>` they shared a key and one overwrote the other.
    const s = createInitialState(tags, DAY);
    expect(s.boards).toHaveLength(5);
    expect(s.boards[0].target).toBe("CAT");
    expect(s.boards[1].target).toBe("DOG");
    expect(s.boards[0].length).toBe(s.boards[1].length);
  });

  it("chaque board démarre avec hintedChars vide", () => {
    const s = createInitialState(tags, DAY);
    expect(s.boards.every((b) => b.hintedChars.length === 0)).toBe(true);
  });
});

describe("reducer", () => {
  it("KEY_INPUT ajoute le caractère en majuscule", () => {
    const s = reducer(stateOf(board("CAT", 0)), {
      type: "KEY_INPUT",
      char: "c",
    });
    expect(s.boards[0].current).toBe("C");
  });

  it("KEY_INPUT ignoré quand la saisie est pleine", () => {
    const s = reducer(stateOf(board("CAT", 0, { current: "DOG" })), {
      type: "KEY_INPUT",
      char: "X",
    });
    expect(s.boards[0].current).toBe("DOG");
  });

  it("KEY_INPUT ignoré quand la partie est finie", () => {
    const s = reducer(stateOf(board("CAT", 0, { status: "won" })), {
      type: "KEY_INPUT",
      char: "X",
    });
    expect(s.boards[0].current).toBe("");
  });

  it("DELETE retire le dernier caractère", () => {
    const s = reducer(stateOf(board("CAT", 0, { current: "CA" })), {
      type: "DELETE",
    });
    expect(s.boards[0].current).toBe("C");
  });

  it("SUBMIT incomplet → invalid, aucun essai consommé", () => {
    const s = reducer(stateOf(board("CAT", 0, { current: "CA" })), {
      type: "SUBMIT",
    });
    expect(s.boards[0].invalid).toBe(true);
    expect(s.boards[0].guesses).toHaveLength(0);
  });

  it("SUBMIT mot inconnu → invalid", () => {
    const s = reducer(stateOf(board("CAT", 0, { current: "XYZ" })), {
      type: "SUBMIT",
    });
    expect(s.boards[0].invalid).toBe(true);
    expect(s.boards[0].guesses).toHaveLength(0);
  });

  it("SUBMIT correct → won", () => {
    const s = reducer(stateOf(board("CAT", 0, { current: "CAT" })), {
      type: "SUBMIT",
    });
    expect(s.boards[0].status).toBe("won");
    expect(s.boards[0].guesses).toEqual(["CAT"]);
    expect(s.boards[0].current).toBe("");
  });

  it("SUBMIT valide mais faux (pas le 6e) → playing", () => {
    const s = reducer(stateOf(board("CAT", 0, { current: "DOG" })), {
      type: "SUBMIT",
    });
    expect(s.boards[0].status).toBe("playing");
    expect(s.boards[0].guesses).toHaveLength(1);
  });

  it("SUBMIT du 6e essai faux → lost", () => {
    const prior = ["DOG", "BAT", "DOG", "BAT", "DOG"];
    const start = stateOf(
      board("CAT", 0, {
        current: "BAT",
        guesses: prior,
        evaluations: prior.map((g) => evaluateGuess(g, "CAT")),
      }),
    );
    const s = reducer(start, { type: "SUBMIT" });
    expect(s.boards[0].status).toBe("lost");
    expect(s.boards[0].guesses).toHaveLength(6);
  });

  it("SELECT_SLOT change d'onglet sans toucher à l'état des autres", () => {
    const start = stateOf(board("CAT", 0, { current: "CA" }));
    const s = reducer(start, { type: "SELECT_SLOT", slot: 1 });
    expect(s.activeSlot).toBe(1);
    expect(s.boards[1].target).toBe("DOG");
    expect(s.boards[0].current).toBe("CA");
  });

  it("SELECT_SLOT ne recrée pas le board visé", () => {
    const start = stateOf(board("CAT", 0, { current: "CA" }));
    const apres = reducer(start, { type: "SELECT_SLOT", slot: 2 });
    expect(apres.boards[2]).toBe(start.boards[2]);
    const retour = reducer(apres, { type: "SELECT_SLOT", slot: 0 });
    expect(retour.boards[0].current).toBe("CA");
  });

  it("SELECT_SLOT hors bornes est ignoré", () => {
    const start = stateOf(board("CAT", 0));
    expect(reducer(start, { type: "SELECT_SLOT", slot: 5 })).toBe(start);
    expect(reducer(start, { type: "SELECT_SLOT", slot: -1 })).toBe(start);
  });

  it("PRACTICE re-tire les cinq pseudos en mode entraînement", () => {
    const start = stateOf(
      board("CAT", 0, {
        guesses: ["CAT"],
        evaluations: [evaluateGuess("CAT", "CAT")],
        status: "won",
        hintedChars: ["C"],
      }),
    );
    const s = reducer(start, { type: "PRACTICE" });
    expect(s.activeSlot).toBe(0);
    expect(s.boards).toHaveLength(5);
    expect(s.boards.every((b) => b.mode === "practice")).toBe(true);
    expect(s.boards.every((b) => b.status === "playing")).toBe(true);
    expect(s.boards.every((b) => b.guesses.length === 0)).toBe(true);
    expect(s.boards.every((b) => b.hintedChars.length === 0)).toBe(true);
    // Practice skips the tags already on screen: no board comes back identical.
    expect(s.boards.map((b) => b.target)).not.toContain("CAT");
  });

  it("CLEAR_INVALID remet le flag à false", () => {
    const s = reducer(stateOf(board("CAT", 0, { invalid: true })), {
      type: "CLEAR_INVALID",
    });
    expect(s.boards[0].invalid).toBe(false);
  });
});

describe("hintCandidates", () => {
  it("exclut les caractères déjà present/correct au clavier et déjà indicés", () => {
    // Guess DOG against CAT: nothing of the target is revealed (D,O,G absent).
    // We hint C. A and T then remain as candidates (C excluded, being hinted).
    const b = board("CAT", 0, { hintedChars: ["C"] });
    expect(hintCandidates(b).sort()).toEqual(["A", "T"]);
  });

  it("exclut un caractère révélé present/correct par un essai", () => {
    // Guess BAT against CAT: A and T revealed (A present/correct, T correct).
    // Only C stays hidden.
    const b = board("CAT", 0, {
      guesses: ["BAT"],
      evaluations: [evaluateGuess("BAT", "CAT")],
    });
    expect(hintCandidates(b)).toEqual(["C"]);
  });
});

describe("reducer HINT / GIVE_UP", () => {
  afterEach(() => vi.restoreAllMocks());

  it("HINT ajoute un caractère caché de la cible sans consommer d'essai", () => {
    const start = stateOf(board("CAT", 0));
    const s = reducer(start, { type: "HINT" });
    expect(s.boards[0].hintedChars).toHaveLength(1);
    expect(["C", "A", "T"]).toContain(s.boards[0].hintedChars[0]);
    expect(s.boards[0].guesses).toHaveLength(0);
    expect(s.boards[0].current).toBe("");
  });

  it("HINT ne duplique jamais un caractère déjà indicé", () => {
    // C already hinted; we force the draw onto the first remaining candidate.
    vi.spyOn(Math, "random").mockReturnValue(0);
    const start = stateOf(board("CAT", 0, { hintedChars: ["C"] }));
    const s = reducer(start, { type: "HINT" });
    // C stays in the list (already hinted), a new character is added,
    // and no duplicate appears.
    expect(s.boards[0].hintedChars).toContain("C");
    expect(s.boards[0].hintedChars).toHaveLength(2);
    expect(new Set(s.boards[0].hintedChars).size).toBe(
      s.boards[0].hintedChars.length,
    );
  });

  it("HINT no-op quand tous les candidats sont épuisés", () => {
    const start = stateOf(board("CAT", 0, { hintedChars: ["C", "A", "T"] }));
    const s = reducer(start, { type: "HINT" });
    expect(s).toBe(start);
  });

  it("HINT no-op quand la partie n'est pas en cours", () => {
    const start = stateOf(board("CAT", 0, { status: "won" }));
    const s = reducer(start, { type: "HINT" });
    expect(s).toBe(start);
  });

  it("GIVE_UP passe le board en lost", () => {
    const start = stateOf(board("CAT", 0));
    const s = reducer(start, { type: "GIVE_UP" });
    expect(s.boards[0].status).toBe("lost");
  });

  it("GIVE_UP no-op si la partie est déjà terminée", () => {
    const start = stateOf(board("CAT", 0, { status: "won" }));
    const s = reducer(start, { type: "GIVE_UP" });
    expect(s).toBe(start);
  });
});

describe("rotation quotidienne", () => {
  // WHICH tags a day serves is `dailyTags`' job and is tested in
  // lib/wordle/selection.test.ts. Here the state simply mirrors the tags it was
  // handed.
  it("rend les cibles du jour, en mode daily", () => {
    const a = createInitialState(tags, 100);
    const b = createInitialState(tags, 100);
    expect(a.boards.map((x) => x.target)).toEqual(
      b.boards.map((x) => x.target),
    );
    expect(a.boards.every((x) => x.mode === "daily")).toBe(true);
    expect(a.boards.every((x) => x.day === 100)).toBe(true);
  });

  it("PRACTICE bascule les boards en entraînement", () => {
    const reducer = createWordleReducer(data, 100);
    const apres = reducer(createInitialState(tags, 100), {
      type: "PRACTICE",
    });
    expect(apres.boards.every((b) => b.mode === "practice")).toBe(true);
  });
});

describe("plafond d'indices", () => {
  it(`refuse au-delà de ${MAX_HINTS} indices`, () => {
    const reducer = createWordleReducer(data, 100);
    let state = createInitialState(tags, 100);
    for (let i = 0; i < MAX_HINTS + 3; i++)
      state = reducer(state, { type: "HINT" });
    expect(state.boards[0].hintedChars.length).toBeLessThanOrEqual(MAX_HINTS);
  });
});

describe("RESTORE_BOARD", () => {
  it("réinstalle un board sans toucher aux autres postes", () => {
    const reducer = createWordleReducer(data, 100);
    let state = createInitialState(tags, 100);
    // Slot 1 is the OTHER three-character board: under the old length-keyed
    // shape, restoring slot 0 would have overwritten it.
    const voisin = state.boards[1];
    const repris = { ...state.boards[0], guesses: ["CAT"] };
    state = reducer(state, { type: "RESTORE_BOARD", board: repris });
    expect(state.boards[0].guesses).toEqual(["CAT"]);
    expect(state.boards[1]).toBe(voisin);
  });
});
