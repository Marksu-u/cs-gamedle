import { createTranslator } from "next-intl";
import { describe, expect, it } from "vitest";
import { LAUNCH_DAY } from "@/lib/daily/clock";
import type { GridRow } from "@/lib/guessr/types";
import en from "@/messages/en.json";
import fr from "@/messages/fr.json";
import {
  buildDayShare,
  buildGuessrShare,
  buildMolShare,
  buildWordleShare,
  type DayShareData,
  type GuessrShareData,
  type MolShareData,
  type ShareT,
  type WordleShareData,
} from "./format";

const catalogues = { en, fr } as const;
type Locale = keyof typeof catalogues;

function t(locale: Locale): ShareT {
  return createTranslator({
    locale,
    messages: catalogues[locale],
  }) as unknown as ShareT;
}

const URL = "https://example.test/wordle";

const wordle: WordleShareData = {
  length: 5,
  day: LAUNCH_DAY,
  won: true,
  attempts: 2,
  hints: 0,
  evaluations: [
    ["absent", "present", "absent", "absent", "absent"],
    ["correct", "correct", "correct", "correct", "correct"],
  ],
  url: URL,
};

// Only the fields the builder reads. The player names are here on purpose: the
// leak test below proves they never reach the output.
function guessRow(name: string, matches: string[]): GridRow {
  const [nationality, team, former, role, age, majors, tournaments] = matches;
  const text = (match: string) => ({ kind: "text", match, value: "" });
  return {
    kind: "guess",
    result: {
      player: { name },
      correct: matches.every((m) => m === "exact"),
      nationality: text(nationality),
      current_team: text(team),
      previous_teams: text(former),
      role: text(role),
      age: text(age),
      majors: text(majors),
      tournaments_won: text(tournaments),
    },
  } as unknown as GridRow;
}

// Newest first, exactly as the reducer stores them and the grid shows them.
const guessrRows: GridRow[] = [
  guessRow("karrigan", Array<string>(7).fill("exact")),
  { kind: "hint", field: "age", result: { kind: "number", match: "exact" } },
  guessRow("device", [
    "miss",
    "partial",
    "miss",
    "miss",
    "miss",
    "miss",
    "miss",
  ]),
] as unknown as GridRow[];

const guessr: GuessrShareData = {
  day: LAUNCH_DAY,
  rows: guessrRows,
  won: true,
  url: URL,
};

const mol: MolShareData = {
  day: LAUNCH_DAY,
  category: "rating",
  results: [true, false, true],
  url: URL,
};

const dayData: DayShareData = {
  day: LAUNCH_DAY,
  runScore: 1240,
  streak: 12,
  multiplier: 1.75,
  puzzles: {
    "wordle-3": { status: "won", points: 60, state: null },
    "wordle-4": { status: "lost", points: 0, state: null },
    guessr: { status: "won", points: 200, state: null },
    "mol-rating": { status: "won", points: 140, state: { score: 10 } },
    "mol-prize": { status: "won", points: 70, state: { score: 5 } },
  },
  url: "https://example.test",
};

describe("buildWordleShare", () => {
  it("renders the grid in board order, winning row last", () => {
    expect(buildWordleShare(wordle, t("en"))).toContain(
      "⬛🟨⬛⬛⬛\n🟩🟩🟩🟩🟩",
    );
  });

  it("marks a miss with X over the attempt cap", () => {
    expect(buildWordleShare({ ...wordle, won: false }, t("en"))).toContain(
      "X/6",
    );
  });

  it("mentions hints only when some were used", () => {
    expect(buildWordleShare(wordle, t("en"))).not.toContain("💡");
    expect(buildWordleShare({ ...wordle, hints: 2 }, t("en"))).toContain("💡2");
  });

  it("ends with the link it was given", () => {
    expect(buildWordleShare(wordle, t("en")).endsWith(URL)).toBe(true);
  });
});

describe("buildGuessrShare", () => {
  it("keeps the board order, newest guess on top", () => {
    expect(buildGuessrShare(guessr, t("en"))).toContain(
      "🟩🟩🟩🟩🟩🟩🟩\n⬛🟨⬛⬛⬛⬛⬛",
    );
  });

  it("leaves hint rows out of the grid and counts them in the header", () => {
    const out = buildGuessrShare(guessr, t("en"));
    expect(out.split("\n").filter((l) => /^[🟩🟨⬛]+$/u.test(l))).toHaveLength(
      2,
    );
    expect(out).toContain("💡1");
  });

  it("says so when the player gave up", () => {
    expect(buildGuessrShare({ ...guessr, won: false }, t("en"))).toContain(
      "Gave up",
    );
  });
});

describe("buildMolShare", () => {
  it("pads a run that ended early", () => {
    expect(buildMolShare(mol, t("en"))).toContain("✅❌✅⬜⬜⬜⬜⬜⬜⬜");
  });

  it("scores out of ten", () => {
    expect(buildMolShare(mol, t("en"))).toContain("2/10");
  });

  it("names the category it was played in", () => {
    expect(buildMolShare(mol, t("en"))).toContain("Rating");
    expect(buildMolShare({ ...mol, category: "prize" }, t("en"))).toContain(
      "Prize money",
    );
  });
});

describe("buildDayShare", () => {
  it("draws one square per puzzle, unplayed included", () => {
    const out = buildDayShare(dayData, t("en"));
    expect(out).toContain("🟩🟥⬜⬜⬜⬜"); // six Wordle
    expect(out).toContain("🟩🟨"); // two More or Lessr: 10/10 then 5/10
  });

  it("shows the multiplier only when the streak earns one", () => {
    expect(buildDayShare(dayData, t("en"))).toContain("×1.75");
    expect(
      buildDayShare({ ...dayData, streak: 1, multiplier: 1 }, t("en")),
    ).not.toContain("×");
  });

  it("survives a day where nothing has been played", () => {
    const out = buildDayShare({ ...dayData, puzzles: {} }, t("en"));
    expect(out).toContain("⬜⬜⬜⬜⬜⬜");
  });
});

// The two guards nothing else in the suite provides.
describe("every builder, in every language", () => {
  const outputs = (locale: Locale) => [
    buildWordleShare(wordle, t(locale)),
    buildWordleShare({ ...wordle, won: false, hints: 3 }, t(locale)),
    buildGuessrShare(guessr, t(locale)),
    buildGuessrShare({ ...guessr, won: false }, t(locale)),
    buildMolShare(mol, t(locale)),
    buildMolShare({ ...mol, category: "prize" }, t(locale)),
    buildDayShare(dayData, t(locale)),
    buildDayShare({ ...dayData, streak: 1, multiplier: 1 }, t(locale)),
  ];

  // A key looked up from a variable renders as its own path when it misses, and
  // neither typecheck nor the catalogue test can see it.
  it.each(["en", "fr"] as const)("never renders a raw key (%s)", (locale) => {
    for (const out of outputs(locale)) {
      expect(out).not.toMatch(
        /\b(share|guessr|wordle|moreOrLessr|game|menu|score|nav|modes|site)\.[a-zA-Z]/,
      );
    }
  });

  // The whole point of the feature: shape of the attempt, never the answer.
  it.each(["en", "fr"] as const)("never leaks an answer (%s)", (locale) => {
    for (const out of outputs(locale)) {
      expect(out).not.toContain("karrigan");
      expect(out).not.toContain("device");
    }
  });
});
