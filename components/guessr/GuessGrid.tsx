import GuessRow, { HintRow } from "./GuessRow";
import type { GridRow } from "@/lib/guessr/types";

const HEADERS = [
  "Joueur",
  "Nationalité",
  "Équipe",
  "Anciennes équipes",
  "Rôle",
  "Âge",
  "Majors",
  "Tournois",
];

export default function GuessGrid({ rows }: { rows: GridRow[] }) {
  if (rows.length === 0) return null;
  return (
    <div className="w-full overflow-x-auto">
      <div className="min-w-[680px] space-y-1.5">
        <div className="grid grid-cols-[0.85fr_0.95fr_1fr_1.3fr_0.9fr_0.7fr_0.75fr_0.8fr] gap-1.5">
          {HEADERS.map((h) => (
            <div
              key={h}
              className="px-1 text-center text-[10px] tracking-[0.08em] text-[color:var(--muted)] uppercase"
            >
              {h}
            </div>
          ))}
        </div>
        {rows.map((row) =>
          row.kind === "guess" ? (
            <GuessRow key={row.result.player.name} result={row.result} />
          ) : (
            <HintRow
              key={`hint-${row.field}`}
              field={row.field}
              result={row.result}
            />
          ),
        )}
      </div>
    </div>
  );
}
