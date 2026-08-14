import GameModeCard from "@/components/GameModeCard";
import { csModes } from "@/data/modes";

export default function Home() {
  return (
    <main className="cs2-hero relative flex min-h-dvh flex-col justify-center overflow-hidden px-6 py-12 sm:px-10">
      <div className="relative mx-auto w-full max-w-3xl">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="mb-2.5 text-xs tracking-[0.25em] text-[color:var(--muted)] uppercase">
              Wordle&nbsp;•&nbsp;Guessr
            </p>
            <h1 className="cs2-display text-foreground text-4xl leading-[0.9] font-extrabold uppercase italic">
              <span className="block">Counter</span>
              <span className="flex items-end gap-3.5">
                Strike
                <span className="cs2-outline text-6xl leading-[0.8]">2</span>
              </span>
            </h1>
          </div>
          <span
            aria-hidden="true"
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-black/30 text-[#0e0f12]"
          >
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="12" cy="12" r="9" />
              <path d="M12 3v3M12 18v3M3 12h3M18 12h3" />
              <circle cx="12" cy="12" r="1.5" />
            </svg>
          </span>
        </div>

        <p className="text-foreground/80 mt-3.5 max-w-[46ch] text-sm">
          Le hub des mini-jeux CS2. Choisis ton mode : devine le mot du jour ou
          identifie le pro.
        </p>

        <div className="mt-6 grid grid-cols-1 gap-3.5 sm:grid-cols-2">
          {csModes.map((mode) => (
            <GameModeCard
              key={mode.id}
              label={mode.label}
              description={mode.description}
              href={mode.href}
              icon={mode.icon}
            />
          ))}
        </div>
      </div>
    </main>
  );
}
