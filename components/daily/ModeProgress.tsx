"use client";

import { useDay } from "@/lib/daily/useDailyPuzzle";
import { useDailyState, useHydrated } from "@/lib/daily/store";
import type { PuzzleId } from "@/lib/daily/types";

// Grilles quotidiennes rattachées à chaque mode de l'accueil. L'ordre et le
// nombre viennent du périmètre : 6 Wordle, 1 Guessr, 2 More or Lessr.
const PUZZLES_PAR_MODE: Record<string, PuzzleId[]> = {
  wordle: [
    "wordle-3",
    "wordle-4",
    "wordle-5",
    "wordle-6",
    "wordle-7",
    "wordle-8",
  ],
  guessr: ["guessr"],
  "more-or-lessr": ["mol-rating", "mol-prize"],
};

export default function ModeProgress({ modeId }: { modeId: string }) {
  const state = useDailyState();
  const hydrated = useHydrated();
  const day = useDay();

  const ids = PUZZLES_PAR_MODE[modeId] ?? [];
  if (ids.length === 0) return null;

  const puzzles = state.progress?.day === day ? state.progress.puzzles : {};
  const faites = ids.filter((id) => {
    const s = puzzles[id]?.status;
    return s !== undefined && s !== "playing";
  }).length;

  const complet = hydrated && faites === ids.length;

  return (
    <span
      className={`rounded-md px-2 py-0.5 font-mono text-xs ${
        complet
          ? "bg-[var(--accent-soft)] text-[color:var(--accent)]"
          : "text-[color:var(--muted)]"
      }`}
    >
      {hydrated ? `${faites}/${ids.length}` : `—/${ids.length}`}
    </span>
  );
}
