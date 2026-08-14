import { act } from "react";
import { renderToString } from "react-dom/server";
import { hydrateRoot } from "react-dom/client";
import { beforeEach, describe, expect, it } from "vitest";
import { dayIndex } from "@/lib/daily/clock";
import { dailyStore } from "@/lib/daily/store";
import { STORAGE_KEY } from "@/lib/daily/types";
import { dailyWord } from "@/lib/wordle/selection";
import type { WordleData } from "@/lib/wordle/types";
import wordleData from "@/app/data/cs2/wordle.json";
import WordleGame from "./WordleGame";

// Reprise après rafraîchissement, testée à travers un VRAI cycle
// rendu-serveur + hydratation.
//
// C'est indispensable : monté uniquement côté client, le composant se répare
// tout seul et le bug est invisible. Il n'apparaît qu'avec l'hydratation, parce
// que le premier rendu client voit encore l'instantané serveur — donc un
// stockage vide.
const data = wordleData as WordleData;

function poserPartieEnCours(guesses: string[]) {
  const day = dayIndex();
  const target = dailyWord(data, 5, day);
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({
      version: 1,
      meta: {
        streak: 3,
        lastPlayedDay: day - 1,
        runScore: 500,
        recordScore: 900,
      },
      progress: {
        day,
        puzzles: {
          "wordle-5": {
            status: "playing",
            points: 0,
            state: {
              target,
              length: 5,
              guesses,
              evaluations: guesses.map(() => [
                "absent",
                "absent",
                "absent",
                "absent",
                "absent",
              ]),
              current: "",
              status: "playing",
              invalid: false,
              hintedChars: [],
              mode: "daily",
              day,
            },
          },
        },
      },
    }),
  );
}

async function hydrater() {
  const html = renderToString(<WordleGame data={data} />);
  const container = document.createElement("div");
  container.innerHTML = html;
  document.body.appendChild(container);
  await act(async () => {
    hydrateRoot(container, <WordleGame data={data} />);
  });
  return container;
}

function grillesStockees() {
  const brut = localStorage.getItem(STORAGE_KEY);
  return brut ? JSON.parse(brut).progress?.puzzles : undefined;
}

describe("reprise d'une grille quotidienne après rafraîchissement", () => {
  beforeEach(() => {
    localStorage.clear();
    dailyStore.reset();
    document.body.innerHTML = "";
  });

  it("ne perd pas les essais déjà joués", async () => {
    poserPartieEnCours(["ADREN", "BLAST"]);
    await hydrater();
    expect(grillesStockees()?.["wordle-5"]?.state.guesses).toEqual([
      "ADREN",
      "BLAST",
    ]);
  });

  it("réaffiche les essais dans la grille", async () => {
    poserPartieEnCours(["ADREN"]);
    const container = await hydrater();
    // Les lettres du premier essai doivent être rendues dans les tuiles.
    expect(container.textContent).toContain("A");
    expect(grillesStockees()?.["wordle-5"]?.state.guesses).toEqual(["ADREN"]);
  });

  it("ne remet pas le compteur d'essais à zéro (sinon le score est rendu)", async () => {
    // Le vrai coût du bug : trois essais consommés, puis rafraîchissement, et la
    // grille repartait à zéro essai — donc au score maximal.
    poserPartieEnCours(["ADREN", "BLAST", "CADIA"]);
    await hydrater();
    const essais = grillesStockees()?.["wordle-5"]?.state.guesses;
    expect(essais).toHaveLength(3);
  });

  it("laisse le stockage intact quand il n'y a rien à reprendre", async () => {
    await hydrater();
    // Aucune partie en cours : rien ne doit être inventé avant que le joueur joue.
    const grilles = grillesStockees();
    expect(grilles?.["wordle-5"]?.state?.guesses ?? []).toEqual([]);
  });
});
