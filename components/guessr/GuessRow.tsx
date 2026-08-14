import { nationToFlag } from "@/lib/more-or-lessr/flags";
import { HINT_FIELDS } from "@/lib/guessr/hints";
import type {
  FieldResult,
  GuessResult,
  HintField,
  Match,
} from "@/lib/guessr/types";

// Template de colonnes partagé par les lignes guess et indice (aligné aux headers).
const GRID_COLS =
  "grid grid-cols-[0.85fr_0.95fr_1fr_1.3fr_0.9fr_0.7fr_0.75fr_0.8fr] gap-1.5";

// Couleurs par état, alignées sur le thème CS2 (cs2-theme.css).
const MATCH_BG: Record<Match, string> = {
  exact: "bg-emerald-600/25 border-emerald-500/60",
  partial: "bg-amber-500/20 border-amber-500/50",
  miss: "bg-white/5 border-white/10",
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

// Cellule nationalité (drapeau + nom du pays), réutilisée par guess et indice.
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

// Cellule vide : colonne non révélée d'un indice.
function EmptyCell() {
  return (
    <div className="min-h-[58px] rounded-lg border border-white/10 bg-white/5" />
  );
}

export default function GuessRow({ result }: { result: GuessResult }) {
  const p = result.player;
  return (
    <div className={GRID_COLS}>
      <div className="flex min-h-[58px] items-center justify-center rounded-lg border border-white/10 bg-white/5 px-2 text-center text-[13px] font-bold">
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

// Ligne « indice » : seule la colonne révélée (verte) est visible, le reste vide.
export function HintRow({
  field,
  result,
}: {
  field: HintField;
  result: FieldResult;
}) {
  return (
    <div className={GRID_COLS}>
      <div className="flex min-h-[58px] items-center justify-center rounded-lg border border-amber-500/40 bg-amber-500/10 px-2 text-center text-[12px] font-semibold">
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
