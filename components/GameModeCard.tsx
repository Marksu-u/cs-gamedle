import Link from "next/link";

type Props = {
  label: string;
  description: string;
  href: string;
  icon: "grid" | "guess" | "versus";
};

const icons: Record<Props["icon"], React.ReactNode> = {
  grid: (
    <>
      <rect x="3" y="3" width="7" height="7" />
      <rect x="14" y="3" width="7" height="7" />
      <rect x="3" y="14" width="7" height="7" />
      <rect x="14" y="14" width="7" height="7" />
    </>
  ),
  guess: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M9.5 9a2.5 2.5 0 1 1 3.5 2.3c-.8.4-1 1-1 1.7" />
      <path d="M12 17h.01" />
    </>
  ),
  versus: (
    <>
      <path d="M4 5l7 7-7 7" />
      <path d="M20 5l-7 7 7 7" />
    </>
  ),
};

export default function GameModeCard({
  label,
  description,
  href,
  icon,
}: Props) {
  return (
    <Link
      href={href}
      className="group block rounded-xl border border-[color:var(--border)] bg-[var(--surface)] p-5 transition hover:-translate-y-1 hover:border-[color:var(--accent)]"
    >
      <div className="mb-3 flex items-center gap-2.5">
        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[var(--accent-soft)] text-[color:var(--accent)]">
          <svg
            width="19"
            height="19"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            {icons[icon]}
          </svg>
        </span>
        <span className="cs2-display text-foreground text-2xl font-extrabold uppercase italic">
          {label}
        </span>
      </div>
      <p className="mb-4 text-sm leading-relaxed text-[color:var(--muted)]">
        {description}
      </p>
      <span className="inline-flex items-center gap-1.5 text-xs font-semibold tracking-widest text-[color:var(--accent-hot)] uppercase">
        Jouer
        <svg
          width="15"
          height="15"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M5 12h14M13 6l6 6-6 6" />
        </svg>
      </span>
    </Link>
  );
}
