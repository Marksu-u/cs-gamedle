import { describe, expect, it } from "vitest";
import { statValue } from "@/lib/more-or-lessr/compare";
import { dailySequence } from "@/lib/more-or-lessr/selection";
import {
  TOTAL_ROUNDS,
  type Direction,
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
    peak_rating: 1 + i / 100,
    prize_money: (i + 1) * 100000,
  })),
};
const DAY = 100;
const reducer = createMorelessReducer(data, DAY);
const seq = dailySequence(data, DAY, "rating");

// Renvoie l'état juste après START rating.
function started() {
  return reducer(createInitialState(DAY), {
    type: "START",
    category: "rating",
  });
}
// Direction correcte pour le duel ancre/challenger courant (catégorie rating).
function correctDir(anchor: Player, challenger: Player): Direction {
  return statValue(challenger, "rating") >= statValue(anchor, "rating")
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
    expect(s.category).toBe("rating");
    expect(s.mode).toBe("practice");
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
    // Le timeout NEXT programmé avant l'abandon peut encore se déclencher :
    // il doit rester sans effet une fois la partie terminée.
    expect(reducer(finished, { type: "NEXT" })).toBe(finished);
  });
});
