import { describe, expect, it } from "vitest";
import { statValue } from "@/lib/more-or-lessr/compare";
import { dailySequence } from "@/lib/more-or-lessr/selection";
import {
  TOTAL_ROUNDS,
  type Direction,
  type GameState,
  type MorelessData,
  type Player,
} from "@/lib/more-or-lessr/types";
import { createInitialState, createMorelessReducer } from "./reducer";

const data: MorelessData = {
  game: "test",
  players: Array.from({ length: 28 }, (_, i) => ({
    name: `P${i}`,
    team: "T",
    nationality: "France",
    tournaments_won: i,
    prize_money: (i + 1) * 100000,
  })),
};
const DAY = 100;
const reducer = createMorelessReducer(data, DAY);
const seq = dailySequence(data, DAY, "tournaments");

// Returns the state right after START tournaments.
function started() {
  return reducer(createInitialState(DAY), {
    type: "START",
    category: "tournaments",
  });
}
// The correct direction for the current anchor/challenger duel (tournaments category).
function correctDir(anchor: Player, challenger: Player): Direction {
  return statValue(challenger, "tournaments") >=
    statValue(anchor, "tournaments")
    ? "more"
    : "less";
}

describe("createInitialState", () => {
  it("démarre sur l'écran de sélection", () => {
    expect(createInitialState(DAY).status).toBe("select");
  });
});

describe("START", () => {
  it("arme le 1er duel de la chaîne", () => {
    const s = started();
    expect(s.status).toBe("playing");
    expect(s.round).toBe(1);
    expect(s.score).toBe(0);
    expect(s.anchor).toBe(seq[0]);
    expect(s.challenger).toBe(seq[1]);
    expect(s.nextIndex).toBe(2);
  });
});

describe("GUESS", () => {
  it("bonne direction → +1 et révélation", () => {
    const s = started();
    const next = reducer(s, {
      type: "GUESS",
      direction: correctDir(s.anchor!, s.challenger!),
    });
    expect(next.status).toBe("revealed");
    expect(next.lastCorrect).toBe(true);
    expect(next.score).toBe(1);
    expect(next.lastGuess).toBe(correctDir(s.anchor!, s.challenger!));
  });
  it("mauvaise direction → +0", () => {
    const s = started();
    const wrong: Direction =
      correctDir(s.anchor!, s.challenger!) === "more" ? "less" : "more";
    const next = reducer(s, { type: "GUESS", direction: wrong });
    expect(next.lastCorrect).toBe(false);
    expect(next.score).toBe(0);
  });
  it("ignoré hors de l'état playing", () => {
    const sel = createInitialState(DAY);
    expect(reducer(sel, { type: "GUESS", direction: "more" })).toBe(sel);
  });
});

describe("NEXT (chaîne)", () => {
  it("le challenger révélé devient l'ancre, un nouveau challenger arrive", () => {
    const s = started();
    const revealed = reducer(s, {
      type: "GUESS",
      direction: correctDir(s.anchor!, s.challenger!),
    });
    const next = reducer(revealed, { type: "NEXT" });
    expect(next.status).toBe("playing");
    expect(next.round).toBe(2);
    expect(next.anchor).toBe(seq[1]); // l'ancien challenger
    expect(next.challenger).toBe(seq[2]);
    expect(next.nextIndex).toBe(3);
  });
  it("ignoré hors de l'état revealed", () => {
    const s = started();
    expect(reducer(s, { type: "NEXT" })).toBe(s);
  });
});

describe("fin de partie", () => {
  it("après TOTAL_ROUNDS → finished, score parfait possible", () => {
    let s = started();
    for (let r = 0; r < TOTAL_ROUNDS; r++) {
      s = reducer(s, {
        type: "GUESS",
        direction: correctDir(s.anchor!, s.challenger!),
      });
      s = reducer(s, { type: "NEXT" });
    }
    expect(s.status).toBe("finished");
    expect(s.score).toBe(TOTAL_ROUNDS);
  });
});

describe("PRACTICE", () => {
  it("relance la même catégorie depuis le round 1, en mode entraînement", () => {
    let s = started();
    s = reducer(s, { type: "GUESS", direction: "more" });
    s = reducer(s, { type: "PRACTICE" });
    expect(s.round).toBe(1);
    expect(s.score).toBe(0);
    expect(s.status).toBe("playing");
    expect(s.category).toBe("tournaments");
    expect(s.mode).toBe("practice");
  });
});

describe("per-round results", () => {
  it("starts a run with an empty record", () => {
    expect(started().results).toEqual([]);
  });

  it("records one entry per answer, in order", () => {
    const s = started();
    const wrong: Direction =
      correctDir(s.anchor!, s.challenger!) === "more" ? "less" : "more";
    const first = reducer(s, { type: "GUESS", direction: wrong });
    const second = reducer(reducer(first, { type: "NEXT" }), {
      type: "GUESS",
      direction: "more",
    });
    expect(second.results[0]).toBe(false);
    expect(second.results).toHaveLength(2);
  });

  it("restores a run saved before results existed", () => {
    const ancien = { ...started(), results: undefined };
    const restored = reducer(createInitialState(DAY), {
      type: "RESTORE",
      state: ancien as unknown as GameState,
    });
    expect(restored.results).toEqual([]);
  });
});

describe("GIVE_UP", () => {
  it("depuis playing → finished, score conservé", () => {
    const s = started();
    const next = reducer(s, { type: "GIVE_UP" });
    expect(next.status).toBe("finished");
    expect(next.score).toBe(s.score);
  });
  it("depuis revealed → finished, score conservé", () => {
    const s = started();
    const revealed = reducer(s, {
      type: "GUESS",
      direction: correctDir(s.anchor!, s.challenger!),
    });
    const next = reducer(revealed, { type: "GIVE_UP" });
    expect(next.status).toBe("finished");
    expect(next.score).toBe(revealed.score);
  });
  it("ignoré depuis select", () => {
    const sel = createInitialState(DAY);
    expect(reducer(sel, { type: "GIVE_UP" })).toBe(sel);
  });
  it("ignoré depuis finished", () => {
    const s = started();
    const finished = reducer(s, { type: "GIVE_UP" });
    expect(reducer(finished, { type: "GIVE_UP" })).toBe(finished);
  });
  it("NEXT après un abandon depuis revealed ne ressuscite pas la partie", () => {
    const s = started();
    const revealed = reducer(s, {
      type: "GUESS",
      direction: correctDir(s.anchor!, s.challenger!),
    });
    const finished = reducer(revealed, { type: "GIVE_UP" });
    // The NEXT timeout scheduled before the give-up can still fire: it must have
    // no effect once the run is over.
    expect(reducer(finished, { type: "NEXT" })).toBe(finished);
  });
});
