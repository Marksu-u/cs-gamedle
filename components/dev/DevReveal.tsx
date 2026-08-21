"use client";

import { useState } from "react";

// Dev-only cheat sheet: a discreet button pinned bottom-right that reveals the
// day's answers, so testing a game does not mean solving it first.
//
// Two gates, and both matter. NODE_ENV is a build-time constant that Next inlines
// into the client bundle, so on a production build the `return null` below is the
// whole component and the answers are never shipped. NEXT_PUBLIC_DEV_TOOLS is the
// deliberate escape hatch for a Vercel preview deployment, where NODE_ENV is
// already "production" but the point of the deploy is still to test.
export const DEV_TOOLS =
  process.env.NODE_ENV !== "production" ||
  process.env.NEXT_PUBLIC_DEV_TOOLS === "1";

export type DevAnswer = {
  label: string; // e.g. "Grid 2 (5)"
  value: string; // e.g. "BROKY"
  muted?: boolean; // context rather than answer (e.g. the visible anchor)
};

// Untranslated on purpose: this never reaches a player, and adding keys for it
// would put dev strings in the message catalogues the parity test guards.
export default function DevReveal({ answers }: { answers: DevAnswer[] }) {
  const [open, setOpen] = useState(false);
  if (!DEV_TOOLS) return null;

  return (
    <div className="fixed right-3 bottom-3 z-50 flex flex-col items-end gap-2">
      {/* Values are rendered only once opened, which is necessarily after
          hydration. That is what keeps this safe in Wordle, where the targets are
          drawn in a lazy reducer init and rendering them would otherwise be a
          server/client mismatch. */}
      {open && answers.length > 0 && (
        <div className="max-w-[70vw] rounded-md border border-dashed border-[color:var(--accent)]/50 bg-[var(--surface)] px-3 py-2 font-mono text-xs shadow-xl">
          <ul className="space-y-1">
            {answers.map((a) => (
              <li key={a.label} className="flex items-baseline gap-2">
                <span className="text-[color:var(--muted)]">{a.label}</span>
                <span
                  className={
                    a.muted
                      ? "ml-auto text-[color:var(--muted)]"
                      : "text-foreground ml-auto font-bold"
                  }
                >
                  {a.value}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <button
        type="button"
        aria-label="Reveal answer (dev)"
        title="Reveal answer (dev)"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="rounded-md border border-dashed border-[color:var(--border)] bg-[var(--surface)]/80 px-2 py-1 font-mono text-[0.65rem] tracking-widest text-[color:var(--muted)] uppercase opacity-40 transition hover:border-[color:var(--accent)] hover:text-[color:var(--accent)] hover:opacity-100"
      >
        {open ? "hide" : "dev"}
      </button>
    </div>
  );
}
