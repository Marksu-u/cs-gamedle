// Pure builders for every shared result.
//
// They take a translator CALLBACK rather than importing next-intl, which keeps
// them testable against the real catalogues in both languages — see
// format.test.ts. Every key below is a literal: a key looked up from a variable
// renders as its own raw path when it misses, and nothing but a test catches it.
//
// The rule these builders enforce: reveal the shape of the attempt, never the
// content of the answer. No target, no guessed name and no compared value ever
// crosses this boundary — the parameter types below carry none of them.
//
// They return a `ShareCard`, not a string. `cardToText` at the bottom is one of
// its two renderings; lib/share/image.ts is the other.

import type { ShareCard } from "@/lib/share/card";
import { puzzleNumber } from "@/lib/daily/clock";
import type { PuzzleId, PuzzleProgress } from "@/lib/daily/types";
import type { GridRow } from "@/lib/guessr/types";
import { TOTAL_ROUNDS, type Category } from "@/lib/more-or-lessr/types";
import { MAX_ATTEMPTS, type TileState } from "@/lib/wordle/types";
import {
  DAY_MISSED,
  DAY_PARTIAL,
  DAY_SOLVED,
  DAY_UNPLAYED,
  EMOJI,
  MATCH,
  ROUND_RIGHT,
  ROUND_UNPLAYED,
  ROUND_WRONG,
  TILE,
} from "./emoji";

// Minimal shape of a next-intl translator. Deliberately loose: the builders are
// handed the ROOT translator and address the catalogue by full path, and the
// messages are not type-augmented in this project.
export type ShareT = (
  key: string,
  values?: Record<string, string | number>,
) => string;

// The hint count is worth reporting (a 3/6 with two hints is not a 3/6) but not
// worth a "no hints" line nobody reads.
function detailLine(t: ShareT, head: string, hints: number): string {
  return hints > 0 ? `${head} · ${t("share.hints", { hints })}` : head;
}

// ------------------------------------------------------------------- Wordle

export type WordleShareData = {
  length: number;
  day: number;
  evaluations: TileState[][];
  won: boolean;
  attempts: number;
  hints: number;
  url: string;
};

export function buildWordleShare(d: WordleShareData, t: ShareT): ShareCard {
  // Board order: `Board` renders guesses oldest to newest, so the winning row is
  // the last line. The share mirrors what the player is looking at.
  //
  // `hintedChars` is deliberately absent: hints only ever touched the keyboard,
  // which keeps this grid a pure record of the guesses.
  const rows = d.evaluations.map((row) => ({
    cells: row.map((tile) => TILE[tile]),
  }));

  const score = t("share.wordle.score", {
    attempts: d.won ? d.attempts : t("share.wordle.missed"),
    max: MAX_ATTEMPTS,
  });

  return {
    title: t("share.wordle.header", {
      site: t("site.name"),
      length: d.length,
      number: puzzleNumber(d.day),
    }),
    detail: detailLine(t, score, d.hints),
    rows,
    url: d.url,
  };
}

// ------------------------------------------------------------------- Guessr

export type GuessrShareData = {
  day: number;
  rows: GridRow[];
  won: boolean;
  url: string;
};

export function buildGuessrShare(d: GuessrShareData, t: ShareT): ShareCard {
  // Hint rows are excluded on purpose: a hint reveals one real column, so a row
  // carrying a single 🟩 would tell a reader WHICH attribute is now known.
  const guesses = d.rows.filter((r) => r.kind === "guess");
  const hints = d.rows.length - guesses.length;

  // `rows` is newest-first and GuessGrid renders it straight through, so the
  // winning row is the top line here too. The guessed names stay behind: naming
  // who was tried is elimination information, and the colours alone carry none.
  const rows = guesses.map((r) => ({
    cells: [
      r.result.nationality,
      r.result.current_team,
      r.result.previous_teams,
      r.result.role,
      r.result.age,
      r.result.majors,
      r.result.tournaments_won,
    ].map((f) => MATCH[f.match]),
  }));

  const head = d.won
    ? t("guessr.foundIn", { attempts: guesses.length })
    : t("share.gaveUp");

  return {
    title: t("share.guessr.header", {
      site: t("site.name"),
      number: puzzleNumber(d.day),
    }),
    detail: detailLine(t, head, hints),
    rows,
    url: d.url,
  };
}

// ------------------------------------------------------------ More or Lessr

export type MolShareData = {
  day: number;
  category: Category;
  results: boolean[];
  url: string;
};

export function buildMolShare(d: MolShareData, t: ShareT): ShareCard {
  // A run cut short by giving up leaves the remaining rounds blank rather than
  // pretending they were answered wrong.
  const cells = Array.from({ length: TOTAL_ROUNDS }, (_, i) => {
    if (i >= d.results.length) return ROUND_UNPLAYED;
    return d.results[i] ? ROUND_RIGHT : ROUND_WRONG;
  });

  // Literal keys either side of the branch: a template key here would be the one
  // lookup no static check can see through.
  const category =
    d.category === "rating"
      ? t("moreOrLessr.categories.rating")
      : t("moreOrLessr.categories.prize");

  return {
    title: t("share.mol.header", {
      site: t("site.name"),
      category,
      number: puzzleNumber(d.day),
    }),
    detail: t("share.mol.score", {
      score: d.results.filter(Boolean).length,
      total: TOTAL_ROUNDS,
    }),
    rows: [{ cells }],
    url: d.url,
  };
}

// ---------------------------------------------------------------- Whole day

const WORDLE_IDS: PuzzleId[] = [
  "wordle-3",
  "wordle-4",
  "wordle-5",
  "wordle-6",
  "wordle-7",
  "wordle-8",
];

type Puzzles = Partial<Record<PuzzleId, PuzzleProgress>>;

function square(entry: PuzzleProgress | undefined) {
  if (!entry || entry.status === "playing") return DAY_UNPLAYED;
  return entry.status === "won" ? DAY_SOLVED : DAY_MISSED;
}

// More or Lessr commits `status: "won"` whatever the score, so a green square
// there would lie. The score inside the saved state is the honest signal.
function molSquare(entry: PuzzleProgress | undefined) {
  if (!entry || entry.status === "playing") return DAY_UNPLAYED;
  const score = (entry.state as { score?: number } | null)?.score ?? 0;
  if (score >= TOTAL_ROUNDS) return DAY_SOLVED;
  return score > 0 ? DAY_PARTIAL : DAY_MISSED;
}

export type DayShareData = {
  day: number;
  runScore: number;
  streak: number;
  multiplier: number;
  puzzles: Puzzles;
  url: string;
};

export function buildDayShare(d: DayShareData, t: ShareT): ShareCard {
  return {
    title: t("share.day.header", {
      site: t("site.name"),
      number: puzzleNumber(d.day),
      points: d.runScore,
    }),
    detail:
      d.multiplier > 1
        ? t("share.day.streakMultiplied", {
            streak: d.streak,
            multiplier: d.multiplier,
          })
        : t("share.day.streak", { streak: d.streak }),
    rows: [
      {
        label: t("modes.wordle.label"),
        cells: WORDLE_IDS.map((id) => square(d.puzzles[id])),
      },
      {
        label: t("modes.guessr.label"),
        cells: [square(d.puzzles.guessr)],
      },
      {
        label: t("modes.more-or-lessr.label"),
        cells: [
          molSquare(d.puzzles["mol-rating"]),
          molSquare(d.puzzles["mol-prize"]),
        ],
      },
    ],
    url: d.url,
  };
}

// ------------------------------------------------------------------- Text

// Header, detail, grid, link — separated by blank lines, which is what keeps the
// block readable once Discord has folded it into a single message.
//
// This is the payload that survives everywhere: a plain text field, a browser
// with no clipboard image support, an OS share sheet that refuses files. The
// image never travels without it.
export function cardToText(card: ShareCard, t: ShareT): string {
  const grid = card.rows.map((row) => {
    const squares = row.cells.map((cell) => EMOJI[cell]).join("");
    return row.label === undefined
      ? squares
      : t("share.day.row", { mode: row.label, squares });
  });

  return [card.title, card.detail, "", ...grid, "", card.url].join("\n");
}
