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

describe("reconcile — the streak", () => {
  it("leaves everything alone when today was already played", () => {
    const before = persisted({ streak: 5, lastPlayedDay: 100, runScore: 900 });
    expect(reconcile(before, 100).meta).toEqual(before.meta);
  });

  it("leaves the streak intact the next day, before playing", () => {
    const after = reconcile(
      persisted({ streak: 5, lastPlayedDay: 100, runScore: 900 }),
      101,
    );
    expect(after.meta.streak).toBe(5);
    expect(after.meta.runScore).toBe(900);
  });

  it("breaks the streak and the run score when a day is missed", () => {
    const after = reconcile(
      persisted({ streak: 5, lastPlayedDay: 100, runScore: 900 }),
      102,
    );
    expect(after.meta.streak).toBe(0);
    expect(after.meta.runScore).toBe(0);
  });

  it("preserves the record when the streak breaks", () => {
    const after = reconcile(
      persisted({
        streak: 5,
        lastPlayedDay: 100,
        runScore: 900,
        recordScore: 900,
      }),
      102,
    );
    expect(after.meta.recordScore).toBe(900);
  });

  it("survives an absence of several months", () => {
    const after = reconcile(
      persisted({
        streak: 40,
        lastPlayedDay: 100,
        runScore: 50000,
        recordScore: 50000,
      }),
      500,
    );
    expect(after.meta).toEqual({
      streak: 0,
      lastPlayedDay: 100,
      runScore: 0,
      recordScore: 50000,
    });
  });

  it("breaks nothing for a player who has never played", () => {
    expect(reconcile(persisted({}), 100).meta).toEqual(EMPTY_META);
  });
});

describe("reconcile — today's progress", () => {
  it("discards progress from a past day", () => {
    const after = reconcile(
      persisted(
        { lastPlayedDay: 100 },
        {
          day: 100,
          puzzles: { guessr: { status: "won", points: 200, state: null } },
        },
      ),
      101,
    );
    expect(after.progress).toBeNull();
  });

  it("keeps progress from the current day", () => {
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
  it("starts the streak at 1 on the very first result", () => {
    const after = commitPuzzle(persisted({}), 100, "guessr", {
      status: "won",
      points: 200,
      state: null,
    });
    expect(after.meta.streak).toBe(1);
    expect(after.meta.lastPlayedDay).toBe(100);
  });

  it("applies ×1 on day one of a streak", () => {
    const after = commitPuzzle(persisted({}), 100, "guessr", {
      status: "won",
      points: 200,
      state: null,
    });
    expect(after.meta.runScore).toBe(200);
  });

  it("increments the streak when yesterday was played", () => {
    const after = commitPuzzle(
      persisted({ streak: 6, lastPlayedDay: 99 }),
      100,
      "guessr",
      { status: "won", points: 200, state: null },
    );
    expect(after.meta.streak).toBe(7);
    // Streak of 7 → ×1.5
    expect(after.meta.runScore).toBe(300);
  });

  it("freezes the multiplier for later puzzles the same day", () => {
    let state = commitPuzzle(
      persisted({ streak: 6, lastPlayedDay: 99 }),
      100,
      "guessr",
      {
        status: "won",
        points: 200,
        state: null,
      },
    );
    state = commitPuzzle(state, 100, "wordle-5", {
      status: "won",
      points: 100,
      state: null,
    });
    expect(state.meta.streak).toBe(7); // the streak does not move again during the day
    expect(state.meta.runScore).toBe(300 + 150); // ×1.5 sur les deux
  });

  it("counts the day even when the puzzle is lost", () => {
    const after = commitPuzzle(persisted({}), 100, "guessr", {
      status: "lost",
      points: 0,
      state: null,
    });
    expect(after.meta.streak).toBe(1);
    expect(after.meta.runScore).toBe(0);
  });

  it("updates the record eagerly", () => {
    const after = commitPuzzle(persisted({ recordScore: 100 }), 100, "guessr", {
      status: "won",
      points: 200,
      state: null,
    });
    expect(after.meta.recordScore).toBe(200);
  });

  it("never lowers the record", () => {
    const after = commitPuzzle(
      persisted({ recordScore: 5000 }),
      100,
      "guessr",
      {
        status: "won",
        points: 200,
        state: null,
      },
    );
    expect(after.meta.recordScore).toBe(5000);
  });

  it("records the puzzle's progress", () => {
    const after = commitPuzzle(persisted({}), 100, "wordle-5", {
      status: "won",
      points: 134,
      state: { guesses: ["ZYWOO"] },
    });
    expect(after.progress).toEqual({
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

  it("does not re-score a puzzle already finished that day", () => {
    let state = commitPuzzle(persisted({}), 100, "guessr", {
      status: "won",
      points: 200,
      state: null,
    });
    const scoreAfterFirst = state.meta.runScore;
    state = commitPuzzle(state, 100, "guessr", {
      status: "won",
      points: 200,
      state: null,
    });
    expect(state.meta.runScore).toBe(scoreAfterFirst);
  });

  it("ignores a result whose day no longer matches", () => {
    // DRAWN on day 100, finished after the rollover (we are on day 101): it must
    // neither credit the new day nor extend the streak.
    const before = persisted(
      { streak: 5, lastPlayedDay: 100, runScore: 900 },
      { day: 100, puzzles: {} },
    );
    const after = commitPuzzle(
      before,
      101, // jour courant
      "guessr",
      { status: "won", points: 200, state: null },
      100, // jour du tirage
    );
    expect(after.meta).toEqual(before.meta);
    expect(after.progress).toBeNull();
  });

  it("discards the stale result WITHOUT erasing the current day", () => {
    // The trap: returning `progress: null` unconditionally erases puzzles already
    // finished today, which then become scorable again. The day's score would be
    // counted twice.
    let state = commitPuzzle(
      persisted({ streak: 5, lastPlayedDay: 100, runScore: 900 }),
      101,
      "guessr",
      { status: "won", points: 200, state: null },
    );
    const scoreAfterGuessr = state.meta.runScore;

    // A game drawn yesterday finishes now: it does not count...
    state = commitPuzzle(
      state,
      101,
      "wordle-5",
      { status: "won", points: 300, state: null },
      100,
    );
    expect(state.meta.runScore).toBe(scoreAfterGuessr);
    // ...and must not have erased the Guessr already finished today.
    expect(state.progress?.puzzles.guessr?.status).toBe("won");

    // Donc rejouer le Guessr ne rapporte toujours rien.
    state = commitPuzzle(state, 101, "guessr", {
      status: "won",
      points: 200,
      state: null,
    });
    expect(state.meta.runScore).toBe(scoreAfterGuessr);
  });
});

describe("saveProgress", () => {
  it("saves progress without touching the streak or the score", () => {
    const before = persisted({ streak: 4, lastPlayedDay: 100, runScore: 900 });
    const after = saveProgress(before, 100, "wordle-5", { guesses: ["ZYWOO"] });
    expect(after.meta).toEqual(before.meta);
    expect(after.progress?.puzzles["wordle-5"]).toEqual({
      status: "playing",
      points: 0,
      state: { guesses: ["ZYWOO"] },
    });
  });

  it("a saved then finished puzzle does score its points", () => {
    // Without this assertion, narrowing the "already finished" check to just
    // `status !== undefined` would go unnoticed — and EVERY puzzle resumed after
    // a refresh would then be worth zero.
    let state = saveProgress(persisted({}), 100, "wordle-5", {
      guesses: ["ZYWOO"],
    });
    state = commitPuzzle(state, 100, "wordle-5", {
      status: "won",
      points: 134,
      state: { guesses: ["ZYWOO"] },
    });
    expect(state.meta.runScore).toBe(134);
    expect(state.meta.streak).toBe(1);
  });

  it("does not overwrite a puzzle already finished", () => {
    let state = commitPuzzle(persisted({}), 100, "guessr", {
      status: "won",
      points: 200,
      state: { rows: ["final"] },
    });
    state = saveProgress(state, 100, "guessr", { rows: ["écrasé"] });
    expect(state.progress?.puzzles.guessr?.status).toBe("won");
    expect(state.progress?.puzzles.guessr?.points).toBe(200);
  });

  it("does not resurrect yesterday's game state", () => {
    // A tab opened before the rollover saving after it: yesterday's state must
    // not be rewritten under today's date, or the next day's puzzle resumes with
    // yesterday's guesses.
    const before = persisted(
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
    const after = saveProgress(
      before,
      101,
      "wordle-5",
      { guesses: ["HIER", "ENCORE"] },
      100, // drawn on day 100
    );
    expect(after.progress).toBeNull();
  });
});

describe("reconcile — clock wound back", () => {
  it("treats a last-played-day in the future as a break", () => {
    // The player winds their machine's clock back: without this guard the streak
    // would stay attached to a score it can no longer justify.
    const after = reconcile(
      persisted({
        streak: 9,
        lastPlayedDay: 200,
        runScore: 9200,
        recordScore: 9200,
      }),
      100,
    );
    expect(after.meta.streak).toBe(0);
    expect(after.meta.runScore).toBe(0);
    expect(after.meta.recordScore).toBe(9200);
  });
});
