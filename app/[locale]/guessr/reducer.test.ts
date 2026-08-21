import { afterEach, describe, expect, it, vi } from "vitest";
import {
  createGuessrReducer,
  createInitialState,
  hintCandidates,
} from "./reducer";
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
  updated: "2026-07-31",
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

describe("hintCandidates", () => {
  // A hint costs a try. Spending one to be told "3 majors" when a guess already
  // turned the majors cell green is not a hint, it is a forfeited turn — the
  // reducer only ever excluded columns it had ALREADY hinted, never columns the
  // grid had given away.
  //
  // "Given away" means an exact match specifically: a partial set overlap or a
  // ▲/▼ arrow narrows a column without revealing it, so those stay hintable.
  const pool: GuessrData = {
    game: "guessr",
    updated: "2026-07-31",
    players: [
      p("target", {
        majors: 3,
        age: 30,
        nationality: "Denmark",
        role: ["AWP", "IGL"],
      }),
      // Shares majors and nationality with the target exactly; age differs
      // (arrow only) and role overlaps without matching (amber only).
      p("twin", {
        majors: 3,
        age: 21,
        nationality: "Denmark",
        role: ["AWP"],
      }),
      // Filler: the daily deck refuses a pool under four.
      p("filler1", { majors: 9, age: 40, nationality: "Brazil" }),
      p("filler2", { majors: 8, age: 41, nationality: "Sweden" }),
    ],
  };

  function afterGuessingTwin() {
    const reducer = createGuessrReducer(pool, 100);
    let s = createInitialState(pool, 100);
    s = { ...s, target: pool.players[0] };
    s = reducer(s, { type: "GUESS", name: "twin" });
    expect(s.status).toBe("playing");
    return s;
  }

  it("drops columns a guess already turned green", () => {
    const c = hintCandidates(afterGuessingTwin());
    expect(c).not.toContain("majors");
    expect(c).not.toContain("nationality");
  });

  it("keeps a numeric column that only produced an arrow", () => {
    expect(hintCandidates(afterGuessingTwin())).toContain("age");
  });

  it("keeps a set column that only partially overlapped", () => {
    expect(hintCandidates(afterGuessingTwin())).toContain("role");
  });

  it("drops columns already hinted", () => {
    const reducer = createGuessrReducer(pool, 100);
    let s = createInitialState(pool, 100);
    s = { ...s, target: pool.players[0] };
    s = reducer(s, { type: "HINT" });
    const hinted = hintRows(s.rows)[0];
    const field = hinted.kind === "hint" ? hinted.field : null;
    expect(hintCandidates(s)).not.toContain(field);
  });

  it("is empty once the target itself has been guessed", () => {
    const reducer = createGuessrReducer(pool, 100);
    let s = createInitialState(pool, 100);
    s = { ...s, target: pool.players[0] };
    s = reducer(s, { type: "GUESS", name: "target" });
    // Won, so every column is green. Forced back to playing to isolate the
    // candidate logic from the status guard.
    expect(hintCandidates({ ...s, status: "playing" })).toEqual([]);
  });
});

describe("reducer HINT — no wasted try", () => {
  const pool: GuessrData = {
    game: "guessr",
    updated: "2026-07-31",
    players: [
      p("target", { majors: 3, nationality: "Denmark" }),
      p("twin", { majors: 3, nationality: "Denmark", age: 21 }),
      p("filler1", { majors: 9, age: 40, nationality: "Brazil" }),
      p("filler2", { majors: 8, age: 41, nationality: "Sweden" }),
    ],
  };

  it("never spends a hint on a column the grid already revealed", () => {
    const reducer = createGuessrReducer(pool, 100);
    let s = createInitialState(pool, 100);
    s = { ...s, target: pool.players[0] };
    s = reducer(s, { type: "GUESS", name: "twin" });
    for (let i = 0; i < MAX_HINTS; i++) s = reducer(s, { type: "HINT" });
    const fields = hintRows(s.rows).map((r) =>
      r.kind === "hint" ? r.field : null,
    );
    expect(fields).not.toContain("majors");
    expect(fields).not.toContain("nationality");
    expect(fields.every((f) => f !== undefined)).toBe(true);
  });

  it("is a no-op rather than an empty row when nothing is left to reveal", () => {
    const reducer = createGuessrReducer(pool, 100);
    let s = createInitialState(pool, 100);
    s = { ...s, target: pool.players[0] };
    s = reducer(s, { type: "GUESS", name: "target" });
    s = { ...s, status: "playing" };
    const after = reducer(s, { type: "HINT" });
    expect(after).toBe(s);
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
