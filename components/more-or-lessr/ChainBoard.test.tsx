import { render, screen } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { describe, expect, it } from "vitest";
import en from "@/messages/en.json";
import fr from "@/messages/fr.json";
import type { Category, Player } from "@/lib/more-or-lessr/types";
import ChainBoard from "./ChainBoard";

// This board carried four untranslated strings for a while, one of them a French
// sentence rendered on the English site. Nothing static could see it: the strings
// were literals in JSX, so only a render in both languages catches the class.

const player = (name: string): Player => ({
  name,
  team: "Vitality",
  nationality: "France",
  tournaments_won: 14,
  prize_money: 1_500_000,
});

function renderIn(locale: string, messages: object, category: Category) {
  return render(
    <NextIntlClientProvider locale={locale} messages={messages}>
      <ChainBoard
        anchor={player("dupreeh")}
        challenger={player("flameZ")}
        category={category}
        round={3}
        score={2}
        revealed={false}
        lastGuess={null}
        lastCorrect={null}
        onGuess={() => {}}
      />
    </NextIntlClientProvider>,
  );
}

describe("ChainBoard", () => {
  it.each([
    ["en", en, "Round 3/10", "Click the player with more tournament wins"],
    [
      "fr",
      fr,
      "Manche 3/10",
      "Clique sur le joueur avec le plus de tournois gagnés",
    ],
  ])(
    "renders the round and the instruction in %s",
    (locale, m, round, hint) => {
      const { container, unmount } = renderIn(
        locale as string,
        m as object,
        "tournaments",
      );
      expect(screen.getByText(round as string)).toBeInTheDocument();
      // The stat name sits in its own <span>, so match across element boundaries.
      expect(container.textContent).toContain(hint as string);
      unmount();
    },
  );

  it.each([
    ["en", en, "prize money"],
    ["fr", fr, "prize money"],
  ])("names the prize category in %s", (locale, m, stat) => {
    const { container, unmount } = renderIn(
      locale as string,
      m as object,
      "prize",
    );
    expect(container.textContent).toContain(stat as string);
    unmount();
  });

  it.each([
    ["en", en],
    ["fr", fr],
  ])("never renders a raw translation key (%s)", (locale, m) => {
    for (const category of ["tournaments", "prize"] as const) {
      const { container, unmount } = renderIn(
        locale as string,
        m as object,
        category,
      );
      expect(container.textContent ?? "").not.toMatch(
        /\b(share|guessr|wordle|moreOrLessr|game|menu|score|nav|modes|site)\.[a-zA-Z]/,
      );
      unmount();
    }
  });
});
