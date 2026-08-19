import { act } from "react";
import { renderToString } from "react-dom/server";
import { hydrateRoot } from "react-dom/client";
import { beforeEach, describe, expect, it } from "vitest";
import { dayIndex } from "@/lib/daily/clock";
import { dailyStore } from "@/lib/daily/store";
import { STORAGE_KEY } from "@/lib/daily/types";
import { dailyTags, getGroup } from "@/lib/wordle/selection";
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

// Slot 0 of today's draw: the board `wordle-1` persists. Its length moves with
// the tag drawn, so the seeded guesses are taken from the dictionary group of
// that same length rather than hardcoded.
function slotZero() {
  const day = dayIndex();
  const target = dailyTags(data, day)[0];
  const autres = getGroup(data, target.length).filter((w) => w !== target);
  return { day, target, autres };
}

function seedGameInProgress(count: number): string[] {
  const { day, target, autres } = slotZero();
  const guesses = autres.slice(0, count);
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({
      version: 3,
      meta: {
        streak: 3,
        lastPlayedDay: day - 1,
        runScore: 500,
        recordScore: 900,
      },
      progress: {
        day,
        puzzles: {
          "wordle-1": {
            status: "playing",
            points: 0,
            state: {
              target,
              slot: 0,
              length: target.length,
              guesses,
              evaluations: guesses.map(() =>
                Array.from({ length: target.length }, () => "absent"),
              ),
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
  return guesses;
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
    const joues = seedGameInProgress(2);
    await hydrate();
    expect(storedPuzzles()?.["wordle-1"]?.state.guesses).toEqual(joues);
  });

  it("renders the guesses back into the grid", async () => {
    const joues = seedGameInProgress(1);
    const container = await hydrate();
    // The first guess's characters must be rendered into the tiles.
    expect(container.textContent).toContain(joues[0][0]);
    expect(storedPuzzles()?.["wordle-1"]?.state.guesses).toEqual(joues);
  });

  it("does not reset the attempt counter (which would hand the points back)", async () => {
    // The real cost of the bug: three tries spent, then a refresh, and the
    // board restarted at zero tries — hence at full score.
    seedGameInProgress(3);
    await hydrate();
    const essais = storedPuzzles()?.["wordle-1"]?.state.guesses;
    expect(essais).toHaveLength(3);
  });

  it("leaves storage alone when there is nothing to resume", async () => {
    await hydrate();
    // No game in progress: nothing should be invented before the player plays.
    const grilles = storedPuzzles();
    expect(grilles?.["wordle-1"]?.state?.guesses ?? []).toEqual([]);
  });
});
