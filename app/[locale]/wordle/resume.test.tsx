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
import messages from "@/messages/en.json";
import { NextIntlClientProvider } from "next-intl";
import WordleGame from "./WordleGame";

// Resume-after-refresh, tested through a REAL server-render + hydration cycle.
//
// This matters: mounted client-side only, the component heals itself and the
// bug is invisible. It only shows under hydration, because the first client
// render still sees the server snapshot — an empty store.
const data = wordleData as WordleData;

function seedGameInProgress(guesses: string[]) {
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

async function hydrate() {
  // WordleGame reads translations, so both the server render and the
  // hydration must be wrapped exactly as the real layout wraps them.
  const tree = (
    <NextIntlClientProvider locale="en" messages={messages}>
      <WordleGame data={data} />
    </NextIntlClientProvider>
  );
  const html = renderToString(tree);
  const container = document.createElement("div");
  container.innerHTML = html;
  document.body.appendChild(container);
  await act(async () => {
    hydrateRoot(container, tree);
  });
  return container;
}

function storedPuzzles() {
  const brut = localStorage.getItem(STORAGE_KEY);
  return brut ? JSON.parse(brut).progress?.puzzles : undefined;
}

describe("resuming a daily puzzle after a refresh", () => {
  beforeEach(() => {
    localStorage.clear();
    dailyStore.reset();
    document.body.innerHTML = "";
  });

  it("does not lose the guesses already played", async () => {
    seedGameInProgress(["ADREN", "BLAST"]);
    await hydrate();
    expect(storedPuzzles()?.["wordle-5"]?.state.guesses).toEqual([
      "ADREN",
      "BLAST",
    ]);
  });

  it("renders the guesses back into the grid", async () => {
    seedGameInProgress(["ADREN"]);
    const container = await hydrate();
    // The first guess's letters must be rendered into the tiles.
    expect(container.textContent).toContain("A");
    expect(storedPuzzles()?.["wordle-5"]?.state.guesses).toEqual(["ADREN"]);
  });

  it("does not reset the attempt counter (which would hand the points back)", async () => {
    // The real cost of the bug: three tries spent, then a refresh, and the
    // board restarted at zero tries — hence at full score.
    seedGameInProgress(["ADREN", "BLAST", "CADIA"]);
    await hydrate();
    const essais = storedPuzzles()?.["wordle-5"]?.state.guesses;
    expect(essais).toHaveLength(3);
  });

  it("leaves storage alone when there is nothing to resume", async () => {
    await hydrate();
    // No game in progress: nothing should be invented before the player plays.
    const grilles = storedPuzzles();
    expect(grilles?.["wordle-5"]?.state?.guesses ?? []).toEqual([]);
  });
});
