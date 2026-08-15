import { renderHook, act } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import { dayIndex } from "./clock";
import { dailyStore, useDailyState } from "./store";
import { EMPTY_PERSISTED, STORAGE_KEY } from "./types";

// The store reads the clock itself, so the tests must speak in terms of the REAL
// current day, not an arbitrary number.
const today = () => dayIndex();

describe("dailyStore", () => {
  beforeEach(() => {
    localStorage.clear();
    dailyStore.reset();
  });

  it("starts from a fresh state", () => {
    expect(dailyStore.getSnapshot().meta).toEqual(EMPTY_PERSISTED.meta);
  });

  it("the server snapshot is stable (no render loop)", () => {
    expect(dailyStore.getServerSnapshot()).toBe(dailyStore.getServerSnapshot());
  });

  it("notifies subscribers on every write", () => {
    let calls = 0;
    const unsubscribe = dailyStore.subscribe(() => calls++);
    dailyStore.commit(today(), "guessr", {
      status: "won",
      points: 200,
      state: null,
    });
    expect(calls).toBe(1);
    unsubscribe();
  });

  it("writes to localStorage", () => {
    dailyStore.commit(today(), "guessr", {
      status: "won",
      points: 200,
      state: null,
    });
    expect(localStorage.getItem(STORAGE_KEY)).toContain('"streak":1');
  });

  it("returns a stable snapshot while nothing changes", () => {
    const a = dailyStore.getSnapshot();
    expect(dailyStore.getSnapshot()).toBe(a);
  });

  it("returns a new snapshot after a write", () => {
    const a = dailyStore.getSnapshot();
    dailyStore.commit(today(), "guessr", {
      status: "won",
      points: 200,
      state: null,
    });
    expect(dailyStore.getSnapshot()).not.toBe(a);
  });

  it("discards a result drawn under a different day", () => {
    // This is the whole point of letting the store read the clock: if the caller
    // supplied the current day too, it would pass the same value on both sides
    // and the guard would never fire.
    dailyStore.commit(today() - 1, "guessr", {
      status: "won",
      points: 200,
      state: null,
    });
    expect(dailyStore.getSnapshot().meta.streak).toBe(0);
    expect(dailyStore.getSnapshot().meta.runScore).toBe(0);
  });

  it("saves then reads back the progress of an in-flight puzzle", () => {
    const day = today();
    dailyStore.saveProgress(day, "wordle-5", { guesses: ["ZYWOO"] });
    const p = dailyStore.getSnapshot().progress;
    expect(p?.day).toBe(day);
    expect(p?.puzzles["wordle-5"]?.state).toEqual({ guesses: ["ZYWOO"] });
    expect(dailyStore.getSnapshot().meta.streak).toBe(0);
  });
});

describe("dailyStore — multiple tabs", () => {
  beforeEach(() => {
    localStorage.clear();
    dailyStore.reset();
  });

  it("does not erase a puzzle finished in another tab", () => {
    const day = today();
    // This tab has loaded its snapshot…
    dailyStore.getSnapshot();
    // …then ANOTHER tab finishes a puzzle and writes to storage.
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        version: 1,
        meta: {
          streak: 1,
          lastPlayedDay: day,
          runScore: 110,
          recordScore: 110,
        },
        progress: {
          day: day,
          puzzles: {
            "wordle-5": { status: "won", points: 110, state: null },
          },
        },
      }),
    );
    // This tab then finishes a DIFFERENT puzzle.
    dailyStore.commit(day, "guessr", {
      status: "won",
      points: 200,
      state: null,
    });

    const after = dailyStore.getSnapshot();
    // Both puzzles must coexist, and both scores must add up.
    expect(Object.keys(after.progress?.puzzles ?? {}).sort()).toEqual([
      "guessr",
      "wordle-5",
    ]);
    expect(after.meta.runScore).toBe(310);
  });

  it("does not let a puzzle finished in another tab be re-scored", () => {
    const day = today();
    dailyStore.getSnapshot();
    dailyStore.commit(day, "guessr", {
      status: "won",
      points: 200,
      state: null,
    });
    const score = dailyStore.getSnapshot().meta.runScore;

    // Another tab rewrites the document (without the Guessr it does not know
    // about yet): after the re-read, Guessr stays marked finished here.
    dailyStore.commit(day, "guessr", {
      status: "won",
      points: 200,
      state: null,
    });
    expect(dailyStore.getSnapshot().meta.runScore).toBe(score);
  });
});

describe("useDailyState", () => {
  beforeEach(() => {
    localStorage.clear();
    dailyStore.reset();
  });

  it("returns the current state and updates", () => {
    const { result } = renderHook(() => useDailyState());
    expect(result.current.meta.streak).toBe(0);
    act(() => {
      dailyStore.commit(today(), "guessr", {
        status: "won",
        points: 200,
        state: null,
      });
    });
    expect(result.current.meta.streak).toBe(1);
  });
});
