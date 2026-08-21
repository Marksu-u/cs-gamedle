import { nationToFlag } from "@/lib/more-or-lessr/flags";
import { HINT_FIELDS } from "@/lib/guessr/hints";
import type {
  FieldResult,
  GuessResult,
  HintField,
  Match,
} from "@/lib/guessr/types";

// Column template shared by guess and hint rows (aligned with the headers).
const GRID_COLS =
  "grid grid-cols-[0.85fr_0.95fr_1fr_1.3fr_0.9fr_0.7fr_0.75fr_0.8fr] gap-1.5";

// The neutral block: a column that did not match, the blank columns of a hint
// row, and the player name. Opaque, and on the theme tokens rather than
// `bg-white/5`: translucent, it let the page gradient through, so one and the
// same cell read cool grey on the left of the board and warm brown on the right.
// These are also the exact values an empty Wordle tile uses, which is what keeps
// the two games looking like one product.
const NEUTRAL = "border-[color:var(--border)] bg-[var(--surface)]";

// Colours per state, aligned with the CS2 theme (cs2-theme.css).
const MATCH_BG: Record<Match, string> = {
  exact: "bg-[var(--guessr-exact)] border-[color:var(--guessr-exact-border)]",
  partial:
    "bg-[var(--guessr-partial)] border-[color:var(--guessr-partial-border)]",
  miss: NEUTRAL,
};

function arrow(dir: "up" | "down" | "equal"): string {
  return dir === "up" ? " ▲" : dir === "down" ? " ▼" : "";
}

function cellText(field: FieldResult): string {
  if (field.kind === "set")
    return field.value.length ? field.value.join(", ") : "—";
  if (field.kind === "number") return `${field.value}${arrow(field.direction)}`;
  return field.value;
}

function Cell({ field }: { field: FieldResult }) {
  return (
    <div
      className={`flex min-h-[58px] items-center justify-center rounded-lg border px-2 py-1 text-center text-[13px] font-semibold ${MATCH_BG[field.match]}`}
    >
      {cellText(field)}
    </div>
  );
}

// Nationality cell (flag + country name), reused by guess and hint rows.
function FlagCell({ field }: { field: FieldResult }) {
  const nation = field.kind === "text" ? field.value : "";
  return (
    <div
      className={`flex min-h-[58px] flex-col items-center justify-center rounded-lg border px-2 text-center text-[13px] font-semibold ${MATCH_BG[field.match]}`}
    >
      <span className="text-base">{nationToFlag(nation)}</span>
      <span className="text-[11px] opacity-80">{nation}</span>
    </div>
  );
}

// Empty cell: a column a hint did not reveal.
function EmptyCell() {
  return <div className={`min-h-[58px] rounded-lg border ${NEUTRAL}`} />;
}

export default function GuessRow({ result }: { result: GuessResult }) {
  const p = result.player;
  return (
    <div className={GRID_COLS}>
      <div
        className={`flex min-h-[58px] items-center justify-center rounded-lg border px-2 text-center text-[13px] font-bold ${NEUTRAL}`}
      >
        {p.name}
      </div>
      <FlagCell field={result.nationality} />
      <Cell field={result.current_team} />
      <Cell field={result.previous_teams} />
      <Cell field={result.role} />
      <Cell field={result.age} />
      <Cell field={result.majors} />
      <Cell field={result.tournaments_won} />
    </div>
  );
}

// Hint row: only the revealed column (green) is visible, the rest is blank.
export function HintRow({
  field,
  result,
}: {
  field: HintField;
  result: FieldResult;
}) {
  return (
    <div className={GRID_COLS}>
      <div className="flex min-h-[58px] items-center justify-center rounded-lg border border-[color:var(--guessr-hint-border)] bg-[var(--guessr-hint)] px-2 text-center text-[12px] font-semibold">
        💡 Indice
      </div>
      {HINT_FIELDS.map((f) =>
        f !== field ? (
          <EmptyCell key={f} />
        ) : f === "nationality" ? (
          <FlagCell key={f} field={result} />
        ) : (
          <Cell key={f} field={result} />
        ),
      )}
    </div>
  );
}
