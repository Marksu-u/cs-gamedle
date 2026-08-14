import { renderHook, act } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import { dayIndex } from "./clock";
import { dailyStore, useDailyState } from "./store";
import { EMPTY_PERSISTED, STORAGE_KEY } from "./types";

// Le store lit l'horloge lui-même : les tests doivent donc parler du VRAI jour
// courant, pas d'un numéro arbitraire.
const aujourdhui = () => dayIndex();

describe("dailyStore", () => {
  beforeEach(() => {
    localStorage.clear();
    dailyStore.reset();
  });

  it("part d'un état neuf", () => {
    expect(dailyStore.getSnapshot().meta).toEqual(EMPTY_PERSISTED.meta);
  });

  it("le snapshot serveur est stable (pas de boucle de rendu)", () => {
    expect(dailyStore.getServerSnapshot()).toBe(dailyStore.getServerSnapshot());
  });

  it("notifie les abonnés à chaque écriture", () => {
    let appels = 0;
    const desabonner = dailyStore.subscribe(() => appels++);
    dailyStore.commit(aujourdhui(), "guessr", {
      status: "won",
      points: 200,
      state: null,
    });
    expect(appels).toBe(1);
    desabonner();
  });

  it("écrit dans localStorage", () => {
    dailyStore.commit(aujourdhui(), "guessr", {
      status: "won",
      points: 200,
      state: null,
    });
    expect(localStorage.getItem(STORAGE_KEY)).toContain('"streak":1');
  });

  it("rend un snapshot stable tant que rien ne change", () => {
    const a = dailyStore.getSnapshot();
    expect(dailyStore.getSnapshot()).toBe(a);
  });

  it("rend un nouveau snapshot après une écriture", () => {
    const a = dailyStore.getSnapshot();
    dailyStore.commit(aujourdhui(), "guessr", {
      status: "won",
      points: 200,
      state: null,
    });
    expect(dailyStore.getSnapshot()).not.toBe(a);
  });

  it("écarte un résultat tiré sous un autre jour", () => {
    // C'est tout l'intérêt de laisser le store lire l'horloge : si l'appelant
    // fournissait aussi le jour courant, il passerait la même valeur des deux
    // côtés et le garde-fou ne se déclencherait jamais.
    dailyStore.commit(aujourdhui() - 1, "guessr", {
      status: "won",
      points: 200,
      state: null,
    });
    expect(dailyStore.getSnapshot().meta.streak).toBe(0);
    expect(dailyStore.getSnapshot().meta.runScore).toBe(0);
  });

  it("sauvegarde puis relit la progression d'une grille en cours", () => {
    const jour = aujourdhui();
    dailyStore.saveProgress(jour, "wordle-5", { guesses: ["ZYWOO"] });
    const p = dailyStore.getSnapshot().progress;
    expect(p?.day).toBe(jour);
    expect(p?.puzzles["wordle-5"]?.state).toEqual({ guesses: ["ZYWOO"] });
    expect(dailyStore.getSnapshot().meta.streak).toBe(0);
  });
});

describe("useDailyState", () => {
  beforeEach(() => {
    localStorage.clear();
    dailyStore.reset();
  });

  it("rend l'état courant et se met à jour", () => {
    const { result } = renderHook(() => useDailyState());
    expect(result.current.meta.streak).toBe(0);
    act(() => {
      dailyStore.commit(aujourdhui(), "guessr", {
        status: "won",
        points: 200,
        state: null,
      });
    });
    expect(result.current.meta.streak).toBe(1);
  });
});
