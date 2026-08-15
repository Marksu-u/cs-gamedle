"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";

// Monochrome icons (`currentColor` stroke) to stay in the CS2 art direction —
// colour emoji clashed with the rest of the theme.
const ICON_PATHS = {
  hint: (
    <path d="M9.5 18h5M10.5 21h3M12 3a6 6 0 0 0-3.6 10.8c.7.55 1.1 1.35 1.1 2.2h5c0-.85.4-1.65 1.1-2.2A6 6 0 0 0 12 3Z" />
  ),
  help: (
    <path d="M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18ZM9.6 9.2a2.4 2.4 0 1 1 3.3 2.2c-.75.3-.9.95-.9 1.6M12 16.4h.01" />
  ),
  giveup: <path d="M6 21V4m0 .5h11.5l-2.5 3.75 2.5 3.75H6" />,
} as const;

export type GameMenuIcon = keyof typeof ICON_PATHS;

function Icon({ name }: { name: GameMenuIcon }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-4 w-4 shrink-0"
      aria-hidden="true"
    >
      {ICON_PATHS[name]}
    </svg>
  );
}

export type GameMenuItem = {
  id: string;
  label: string; // e.g. "Hint"
  icon: GameMenuIcon; // clé d'icône monochrome (cf. ICON_PATHS)
  note?: string; // e.g. "2/4" — shown on the right, understated
  disabled?: boolean;
  onSelect: () => void; // the menu closes after selection
};

// Compact dropdown (burger button) reused by all three games to gather the side
// actions (hint / help / give up) in one place.
export default function GameMenu({ items }: { items: GameMenuItem[] }) {
  const t = useTranslations("menu");
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Listeners are attached only while the menu is open, so the page stays light
  // when it is closed — which is most of the time.
  useEffect(() => {
    if (!open) return;

    function handlePointerDown(event: PointerEvent) {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  return (
    <div ref={containerRef} className="relative inline-block">
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={t("options")}
        title={t("options")}
        onClick={() => setOpen((v) => !v)}
        className="rounded-md border border-[color:var(--border)] bg-[var(--surface)] p-2 text-[color:var(--muted)] transition hover:border-[color:var(--accent)] hover:text-[color:var(--accent)]"
      >
        {/* Burger: the universal menu symbol, clearer than a label. */}
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          className="h-4 w-4"
          aria-hidden="true"
        >
          <path d="M4 7h16M4 12h16M4 17h16" />
        </svg>
      </button>

      {open && (
        <div
          role="menu"
          className="absolute top-full right-0 z-30 mt-2 min-w-44 animate-[menu-in_0.15s_ease] rounded-lg border border-[color:var(--border)] bg-[var(--surface)] shadow-xl"
        >
          {items.map((item) => (
            <button
              key={item.id}
              type="button"
              role="menuitem"
              disabled={item.disabled}
              onClick={() => {
                if (item.disabled) return;
                item.onSelect();
                setOpen(false);
              }}
              className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm transition hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Icon name={item.icon} />
              <span>{item.label}</span>
              {item.note && (
                <span className="ml-auto text-xs text-[color:var(--muted)]">
                  {item.note}
                </span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
