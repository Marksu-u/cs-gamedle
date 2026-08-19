"use client";

import { useTranslations } from "next-intl";
import type { BoardState } from "@/lib/wordle/types";

type Props = {
  boards: BoardState[];
  active: number;
  onSelect: (slot: number) => void;
};

// One tab per grid. The label is the tag's LENGTH, not the slot number: length
// is information the player can act on, and the grid width leaks it anyway. A
// solved slot is marked so the day's progress reads at a glance.
export default function SlotTabs({ boards, active, onSelect }: Props) {
  const t = useTranslations("wordle");
  return (
    <div
      className="flex justify-center gap-1.5"
      role="tablist"
      aria-label={t("slots")}
    >
      {boards.map((b) => {
        const isActive = b.slot === active;
        const solved = b.status === "won";
        return (
          <button
            key={b.slot}
            type="button"
            role="tab"
            aria-selected={isActive}
            aria-label={t("slotLabel", { slot: b.slot + 1, length: b.length })}
            onClick={() => onSelect(b.slot)}
            className={`h-9 w-9 rounded-md text-sm font-bold transition ${
              isActive
                ? "bg-[var(--accent)] text-black"
                : solved
                  ? "bg-[var(--wordle-correct)] text-black"
                  : "bg-[var(--surface)] text-[color:var(--muted)] hover:text-foreground"
            }`}
          >
            {b.length}
          </button>
        );
      })}
    </div>
  );
}
