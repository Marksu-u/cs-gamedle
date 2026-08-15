import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { load, save } from "./storage";
import { EMPTY_PERSISTED, STORAGE_KEY, type Persisted } from "./types";

describe("load", () => {
  beforeEach(() => localStorage.clear());

  it("rend un état neuf quand rien n'est stocké", () => {
    expect(load()).toEqual(EMPTY_PERSISTED);
  });

  it("relit ce qui a été écrit", () => {
    const etat: Persisted = {
      version: 1,
      meta: { streak: 3, lastPlayedDay: 100, runScore: 500, recordScore: 900 },
      progress: null,
    };
    save(etat);
    expect(load()).toEqual(etat);
  });

  it("repart de zéro sur un JSON corrompu", () => {
    localStorage.setItem(STORAGE_KEY, "{ pas du json");
    expect(load()).toEqual(EMPTY_PERSISTED);
  });

  it("repart de zéro sur une version inconnue", () => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ version: 99, meta: {}, progress: null }),
    );
    expect(load()).toEqual(EMPTY_PERSISTED);
  });

  it("repart de zéro si `meta` est absent", () => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ version: 1, progress: null }),
    );
    expect(load()).toEqual(EMPTY_PERSISTED);
  });

  it("repart de zéro si un champ de `meta` n'est pas un nombre", () => {
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

  it("repart de zéro si `progress` n'a pas de `puzzles`", () => {
    // Les appelants indexent `progress.puzzles[id]` : une forme partielle les
    // faisait lever, ce qui revenait au même qu'une exception d'ici.
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

  it("ne lève pas si localStorage est inaccessible", () => {
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

  it("ne lève pas si le quota est dépassé", () => {
    const spy = vi
      .spyOn(Storage.prototype, "setItem")
      .mockImplementation(() => {
        throw new Error("QuotaExceededError");
      });
    expect(() => save(EMPTY_PERSISTED)).not.toThrow();
    spy.mockRestore();
  });
});
