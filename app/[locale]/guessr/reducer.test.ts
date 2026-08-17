import { afterEach, describe, expect, it, vi } from "vitest";
import { createGuessrReducer, createInitialState } from "./reducer";
import { MAX_HINTS } from "@/lib/guessr/hints";
import type { GridRow, GuessrData, Player } from "@/lib/guessr/types";

function p(name: string, over: Partial<Player> = {}): Player {
  return {
    name,
    nationality: "France",
    current_team: "T",
    previous_teams: [],
    role: ["Rifler"],
    age: 25,
    majors: 0,
    tournaments_won: 0,
    achievements: [],
    ...over,
  };
}

const data: GuessrData = {
  game: "guessr",
  players: [p("ZywOo"), p("apEX"), p("ropz"), p("rain"), p("flameZ")],
};

const names = data.players.map((x) => x.name);

const guessRows = (rows: GridRow[]) => rows.filter((r) => r.kind === "guess");
const hintRows = (rows: GridRow[]) => rows.filter((r) => r.kind === "hint");

afterEach(() => vi.restoreAllMocks());

describe("createInitialState", () => {
  it("démarre en playing avec une cible du pool et zéro ligne", () => {
    const s = createInitialState(data, 100);
    expect(s.status).toBe("playing");
    expect(s.rows).toEqual([]);
    expect(names).toContain(s.target.name);
  });
});

describe("reducer GUESS", () => {
  it("ignore un nom inconnu du pool", () => {
    const reducer = createGuessrReducer(data, 100);
    const s0 = createInitialState(data, 100);
    const s1 = reducer(s0, { type: "GUESS", name: "unknown_player" });
    expect(s1.rows).toHaveLength(0);
  });

  it("ajoute une ligne guess en tête et passe won si c'est la cible", () => {
    const reducer = createGuessrReducer(data, 100);
    const s0 = createInitialState(data, 100);
    const s1 = reducer(s0, { type: "GUESS", name: s0.target.name });
    expect(s1.rows).toHaveLength(1);
    const row = s1.rows[0];
    expect(row.kind).toBe("guess");
    if (row.kind === "guess") expect(row.result.correct).toBe(true);
    expect(s1.status).toBe("won");
  });

  it("reste playing sur un mauvais guess, plus récent en tête", () => {
    const reducer = createGuessrReducer(data, 100);
    const s0 = createInitialState(data, 100);
    const wrong = data.players.find((x) => x.name !== s0.target.name)!;
    const s1 = reducer(s0, { type: "GUESS", name: wrong.name });
    expect(s1.status).toBe("playing");
    const row = s1.rows[0];
    expect(row.kind).toBe("guess");
    if (row.kind === "guess") expect(row.result.player.name).toBe(wrong.name);
  });

  it("ignore un doublon de proposition (dédup sur les lignes guess)", () => {
    const reducer = createGuessrReducer(data, 100);
    const s0 = createInitialState(data, 100);
    const wrong = data.players.find((x) => x.name !== s0.target.name)!;
    const s1 = reducer(s0, { type: "GUESS", name: wrong.name });
    const s2 = reducer(s1, { type: "GUESS", name: wrong.name });
    expect(guessRows(s2.rows)).toHaveLength(1);
  });

  it("n'accepte plus de guess après victoire", () => {
    const reducer = createGuessrReducer(data, 100);
    const s0 = createInitialState(data, 100);
    const won = reducer(s0, { type: "GUESS", name: s0.target.name });
    const after = reducer(won, { type: "GUESS", name: data.players[0].name });
    expect(after).toBe(won);
  });
});

describe("reducer HINT", () => {
  it("ajoute une ligne hint en tête et consomme un essai", () => {
    const reducer = createGuessrReducer(data, 100);
    const s0 = createInitialState(data, 100);
    const s1 = reducer(s0, { type: "HINT" });
    expect(s1.rows).toHaveLength(1);
    const row = s1.rows[0];
    expect(row.kind).toBe("hint");
    if (row.kind === "hint") expect(row.result.match).toBe("exact");
  });

  it("ne révèle jamais deux fois la même colonne", () => {
    const reducer = createGuessrReducer(data, 100);
    let s = createInitialState(data, 100);
    for (let i = 0; i < MAX_HINTS; i++) s = reducer(s, { type: "HINT" });
    const fields = hintRows(s.rows).flatMap((r) =>
      r.kind === "hint" ? [r.field] : [],
    );
    expect(fields).toHaveLength(MAX_HINTS);
    expect(new Set(fields).size).toBe(MAX_HINTS);
  });

  it("no-op après MAX_HINTS indices", () => {
    const reducer = createGuessrReducer(data, 100);
    let s = createInitialState(data, 100);
    for (let i = 0; i < MAX_HINTS; i++) s = reducer(s, { type: "HINT" });
    const after = reducer(s, { type: "HINT" });
    expect(after).toBe(s);
    expect(hintRows(after.rows)).toHaveLength(MAX_HINTS);
  });

  it("no-op si la partie n'est pas en cours", () => {
    const reducer = createGuessrReducer(data, 100);
    const s0 = createInitialState(data, 100);
    const won = reducer(s0, { type: "GUESS", name: s0.target.name });
    const after = reducer(won, { type: "HINT" });
    expect(after).toBe(won);
  });

  it("les guesses restent possibles entre deux indices", () => {
    const reducer = createGuessrReducer(data, 100);
    const s0 = createInitialState(data, 100);
    const wrong = data.players.find((x) => x.name !== s0.target.name)!;
    const s1 = reducer(s0, { type: "HINT" });
    const s2 = reducer(s1, { type: "GUESS", name: wrong.name });
    expect(guessRows(s2.rows)).toHaveLength(1);
    expect(hintRows(s2.rows)).toHaveLength(1);
    expect(s2.rows).toHaveLength(2);
  });
});

describe("reducer GIVE_UP", () => {
  it("passe le statut à gaveup", () => {
    const reducer = createGuessrReducer(data, 100);
    const s0 = createInitialState(data, 100);
    const s1 = reducer(s0, { type: "GIVE_UP" });
    expect(s1.status).toBe("gaveup");
  });

  it("no-op après victoire", () => {
    const reducer = createGuessrReducer(data, 100);
    const s0 = createInitialState(data, 100);
    const won = reducer(s0, { type: "GUESS", name: s0.target.name });
    const after = reducer(won, { type: "GIVE_UP" });
    expect(after).toBe(won);
  });
});

describe("reducer PRACTICE", () => {
  it("vide les lignes, repart en playing avec une cible du pool, en mode entraînement", () => {
    const reducer = createGuessrReducer(data, 100);
    const s0 = createInitialState(data, 100);
    const won = reducer(s0, { type: "GUESS", name: s0.target.name });
    const practice = reducer(won, { type: "PRACTICE" });
    expect(practice.status).toBe("playing");
    expect(practice.rows).toEqual([]);
    expect(names).toContain(practice.target.name);
    expect(practice.mode).toBe("practice");
  });
});
