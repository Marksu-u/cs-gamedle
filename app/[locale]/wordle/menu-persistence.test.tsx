import { fireEvent, render, screen } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { describe, expect, it } from "vitest";
import en from "@/messages/en.json";
import wordleData from "@/app/data/cs2/wordle.json";
import type { WordleData } from "@/lib/wordle/types";
import WordleGame from "./WordleGame";

// Regression: the options menu used to sit INSIDE the `key={activeSlot}` wrapper
// that replays the board entry animation. Changing grid therefore remounted it —
// the dropdown snapped shut and the burger flickered through its mount
// animation, while the same menu on Guessr / More or Lessr stayed put.
//
// The menu belongs to the day, not to the grid, so it must outlive a slot
// change. Asserting on the OPEN state is what pins that down: a remount is
// invisible on a closed menu but wipes the open one.
const data = wordleData as WordleData;

function renderGame() {
  return render(
    <NextIntlClientProvider locale="en" messages={en}>
      <WordleGame data={data} />
    </NextIntlClientProvider>,
  );
}

describe("Wordle options menu", () => {
  it("stays open when the player switches grid", () => {
    const { unmount } = renderGame();

    fireEvent.click(screen.getByRole("button", { name: "Options" }));
    expect(screen.getByRole("menuitem", { name: /Help/ })).toBeInTheDocument();

    // Second tab: a different tag of the day, i.e. a different board.
    const tabs = screen.getAllByRole("tab");
    fireEvent.click(tabs[1]);

    expect(screen.getByRole("menuitem", { name: /Help/ })).toBeInTheDocument();
    unmount();
  });
});
