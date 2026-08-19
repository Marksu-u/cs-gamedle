import { render, screen } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { describe, expect, it } from "vitest";
import en from "@/messages/en.json";
import type { BoardState } from "@/lib/wordle/types";
import ResultBanner from "./ResultBanner";

const board: BoardState = {
  target: "BLAST",
  slot: 0,
  length: 5,
  guesses: ["ADREN", "BLAST"],
  evaluations: [
    ["absent", "present", "absent", "absent", "absent"],
    ["correct", "correct", "correct", "correct", "correct"],
  ],
  current: "",
  status: "won",
  invalid: false,
  hintedChars: [],
  mode: "daily",
  day: 20679,
};

function renderBanner(b: BoardState) {
  return render(
    <NextIntlClientProvider locale="en" messages={en}>
      <ResultBanner board={b} points={90} onPractice={() => {}} />
    </NextIntlClientProvider>,
  );
}

describe("Wordle result banner", () => {
  it("offers a share on a daily board", () => {
    const { unmount } = renderBanner(board);
    expect(screen.getByRole("button", { name: "Share" })).toBeInTheDocument();
    unmount();
  });

  it("offers none in practice, where there is nothing to compare", () => {
    const { unmount } = renderBanner({ ...board, mode: "practice" });
    expect(screen.queryByRole("button", { name: "Share" })).toBeNull();
    unmount();
  });

  it("never renders a raw translation key", () => {
    const { container, unmount } = renderBanner(board);
    expect(container.textContent ?? "").not.toMatch(
      /\b(share|guessr|wordle|moreOrLessr|game|menu|score|nav|modes|site)\.[a-zA-Z]/,
    );
    unmount();
  });
});
