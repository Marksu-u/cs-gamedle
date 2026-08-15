import { render, screen } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { describe, expect, it } from "vitest";
import en from "@/messages/en.json";
import fr from "@/messages/fr.json";
import type { GridRow } from "@/lib/guessr/types";
import GuessGrid from "./GuessGrid";

// The column headers are the one place a translation key is looked up from an
// ARRAY rather than a literal, so a stale array silently renders the raw key
// ("guessr.columns.Joueur") instead of a label. Static checks cannot see that;
// only rendering can.
const row: GridRow = {
  kind: "guess",
  result: {
    player: {
      name: "karrigan",
      nationality: "Denmark",
      current_team: "FaZe",
      previous_teams: ["Astralis"],
      role: ["IGL"],
      age: 35,
      majors: 1,
      tournaments_won: 15,
      achievements: [],
    },
    correct: false,
    nationality: { kind: "text", match: "miss", value: "Denmark" },
    current_team: { kind: "text", match: "miss", value: "FaZe" },
    previous_teams: { kind: "set", match: "miss", value: ["Astralis"] },
    role: { kind: "set", match: "miss", value: ["IGL"] },
    age: { kind: "number", match: "miss", value: 35, direction: "down" },
    majors: { kind: "number", match: "miss", value: 1, direction: "up" },
    tournaments_won: {
      kind: "number",
      match: "miss",
      value: 15,
      direction: "up",
    },
  },
};

function renderIn(locale: string, messages: object) {
  return render(
    <NextIntlClientProvider locale={locale} messages={messages}>
      <GuessGrid rows={[row]} />
    </NextIntlClientProvider>,
  );
}

describe("GuessGrid headers", () => {
  it.each([
    ["en", en, ["Player", "Nationality", "Team", "Former teams"]],
    ["fr", fr, ["Joueur", "Nationalité", "Équipe", "Anciennes équipes"]],
  ])("renders translated headers in %s", (locale, messages, expected) => {
    const { unmount } = renderIn(locale, messages);
    for (const label of expected as string[]) {
      expect(screen.getByText(label)).toBeInTheDocument();
    }
    unmount();
  });

  it("never renders a raw translation key", () => {
    const { container, unmount } = renderIn("en", en);
    // A missed lookup renders the full path, e.g. "guessr.columns.player".
    expect(container.textContent ?? "").not.toMatch(
      /\b(guessr|wordle|moreOrLessr|game|menu|score|nav)\.[a-zA-Z]/,
    );
    unmount();
  });
});
