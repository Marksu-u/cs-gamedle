import type { Category } from "@/lib/more-or-lessr/types";

type Props = { onSelect: (category: Category) => void };

const CHOICES: { category: Category; title: string; desc: string }[] = [
  {
    category: "rating",
    title: "Rating",
    desc: "Qui a le meilleur peak rating ?",
  },
  {
    category: "prize",
    title: "Prize money",
    desc: "Qui a gagné le plus de $ ?",
  },
];

export default function CategorySelect({ onSelect }: Props) {
  return (
    <div className="grid w-full max-w-xl grid-cols-1 gap-3 sm:grid-cols-2">
      {CHOICES.map((c) => (
        <button
          key={c.category}
          type="button"
          onClick={() => onSelect(c.category)}
          className="group rounded-xl border border-[color:var(--border)] bg-[var(--surface)] p-6 text-left transition hover:-translate-y-1 hover:border-[color:var(--accent)]"
        >
          <span className="cs2-display text-foreground text-2xl font-extrabold uppercase italic">
            {c.title}
          </span>
          <p className="mt-2 text-sm text-[color:var(--muted)]">{c.desc}</p>
          <span className="mt-4 inline-flex items-center gap-1.5 text-xs font-semibold tracking-widest text-[color:var(--accent-hot)] uppercase">
            Jouer →
          </span>
        </button>
      ))}
    </div>
  );
}
