import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { load, save } from "./storage";
import { EMPTY_PERSISTED, STORAGE_KEY, type Persisted } from "./types";

describe("load", () => {
  beforeEach(() => localStorage.clear());

  it("returns a fresh state when nothing is stored", () => {
    expect(load()).toEqual(EMPTY_PERSISTED);
  });

  it("reads back what was written", () => {
    const etat: Persisted = {
      version: 1,
      meta: { streak: 3, lastPlayedDay: 100, runScore: 500, recordScore: 900 },
      progress: null,
    };
    save(etat);
    expect(load()).toEqual(etat);
  });

  it("starts over on corrupt JSON", () => {
    localStorage.setItem(STORAGE_KEY, "{ pas du json");
    expect(load()).toEqual(EMPTY_PERSISTED);
  });

  it("starts over on an unknown version", () => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ version: 99, meta: {}, progress: null }),
    );
    expect(load()).toEqual(EMPTY_PERSISTED);
  });

  it("starts over when `meta` is missing", () => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ version: 1, progress: null }),
    );
    expect(load()).toEqual(EMPTY_PERSISTED);
  });

  it("starts over when a `meta` field is not a number", () => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        version: 1,
        meta: { streak: "sept", lastPlayedDay: 1, runScore: 0, recordScore: 0 },
        progress: null,
      }),
    );
    expect(load()).toEqual(EMPTY_PERSISTED);
  });

  it("starts over when `progress` has no `puzzles`", () => {
    // Callers index into `progress.puzzles[id]`: a partial shape made them throw,
    // which amounts to the same thing as an exception from here.
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        version: 1,
        meta: { streak: 1, lastPlayedDay: 1, runScore: 0, recordScore: 0 },
        progress: { day: 1 },
      }),
    );
    expect(load().progress).toBeNull();
  });

  it("does not throw when localStorage is unreachable", () => {
    const spy = vi
      .spyOn(Storage.prototype, "getItem")
      .mockImplementation(() => {
        throw new Error("SecurityError");
      });
    expect(() => load()).not.toThrow();
    expect(load()).toEqual(EMPTY_PERSISTED);
    spy.mockRestore();
  });
});

describe("save", () => {
  beforeEach(() => localStorage.clear());
  afterEach(() => vi.restoreAllMocks());

  it("does not throw when the quota is exceeded", () => {
    const spy = vi
      .spyOn(Storage.prototype, "setItem")
      .mockImplementation(() => {
        throw new Error("QuotaExceededError");
      });
    expect(() => save(EMPTY_PERSISTED)).not.toThrow();
    spy.mockRestore();
  });
});
