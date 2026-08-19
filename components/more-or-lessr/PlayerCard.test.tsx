import { render } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { describe, expect, it } from "vitest";
import en from "@/messages/en.json";
import fr from "@/messages/fr.json";
import type { Category, Player } from "@/lib/more-or-lessr/types";
import PlayerCard from "./PlayerCard";

// The stat values used to be formatted with a hardcoded "en-US", so a French
// player read "$1,500,000". Only a render in both locales sees it.

const player: Player = {
  name: "flameZ",
  team: "Vitality",
  nationality: "France",
  tournaments_won: 14,
  prize_money: 1_500_000,
};

function renderIn(locale: string, messages: object, category: Category) {
  return render(
    <NextIntlClientProvider locale={locale} messages={messages}>
      <PlayerCard player={player} category={category} revealed />
    </NextIntlClientProvider>,
  );
}

describe("PlayerCard value formatting", () => {
  it("keeps the American forms in English", () => {
    const prize = renderIn("en", en, "prize");
    expect(prize.container.textContent).toContain("$1,500,000");
    prize.unmount();

    const tournaments = renderIn("en", en, "tournaments");
    expect(tournaments.container.textContent).toContain("14");
    tournaments.unmount();
  });

  it("renders the tournament count as a bare integer, in any locale", () => {
    // A count, not money and not a rating: no currency symbol, no decimals, and
    // nothing for a locale to punctuate at this magnitude.
    const { container, unmount } = renderIn("fr", fr, "tournaments");
    expect(container.textContent).toContain("14");
    expect(container.textContent).not.toContain("$");
    expect(container.textContent).not.toContain("14,00");
    unmount();
  });

  it("groups the prize the French way, with the symbol trailing", () => {
    const { container, unmount } = renderIn("fr", fr, "prize");
    const text = container.textContent ?? "";
    // The group separator is a narrow no-break space whose codepoint moves
    // between ICU versions, so assert the shape rather than the exact string.
    expect(text).not.toContain("$1,500,000");
    expect(text).toMatch(/1\s?500\s?000\s?\$/u);
    unmount();
  });

  it("shows nothing but a mark while the value is hidden", () => {
    const { container, unmount } = render(
      <NextIntlClientProvider locale="fr" messages={fr}>
        <PlayerCard player={player} category="prize" revealed={false} />
      </NextIntlClientProvider>,
    );
    expect(container.textContent).toContain("?");
    expect(container.textContent).not.toMatch(/500/);
    unmount();
  });
});
