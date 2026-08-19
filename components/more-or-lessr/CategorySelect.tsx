"use client";

import { useTranslations } from "next-intl";
import type { Category } from "@/lib/more-or-lessr/types";

type Props = { onSelect: (category: Category) => void };

// Ids only — the title and hint of each category come from the catalogue.
const CHOICES: Category[] = ["tournaments", "prize"];

export default function CategorySelect({ onSelect }: Props) {
  const t = useTranslations("moreOrLessr");
  const nav = useTranslations("nav");
  return (
    <div className="grid w-full max-w-xl grid-cols-1 gap-3 sm:grid-cols-2">
      {CHOICES.map((category) => (
        <button
          key={category}
          type="button"
          onClick={() => onSelect(category)}
          className="group rounded-xl border border-[color:var(--border)] bg-[var(--surface)] p-6 text-left transition hover:-translate-y-1 hover:border-[color:var(--accent)]"
        >
          <span className="cs2-display text-foreground text-2xl font-extrabold uppercase italic">
            {t(`categories.${category}`)}
          </span>
          <p className="mt-2 text-sm text-[color:var(--muted)]">
            {t(`categories.${category}Hint`)}
          </p>
          <span className="mt-4 inline-flex items-center gap-1.5 text-xs font-semibold tracking-widest text-[color:var(--accent-hot)] uppercase">
            {nav("play")} →
          </span>
        </button>
      ))}
    </div>
  );
}
