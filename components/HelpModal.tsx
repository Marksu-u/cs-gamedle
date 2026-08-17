"use client";

import { useTranslations } from "next-intl";

import { useEffect } from "react";

type Props = {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode; // help content specific to each game
};

// Generic help popup (game rules), shared by all three games.
export default function HelpModal({ open, onClose, title, children }: Props) {
  const t = useTranslations("menu");
  // Escape should only close when the modal is actually shown.
  useEffect(() => {
    if (!open) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center bg-black/60 px-4"
      onClick={(event) => {
        // Close only on a click on the overlay itself, not on the card.
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-lg animate-[mol-reveal_0.2s_ease] rounded-xl border border-[color:var(--border)] bg-[var(--surface)] p-6">
        <div className="flex items-start justify-between gap-4">
          <h2 className="cs2-display text-2xl font-extrabold uppercase italic">
            {title}
          </h2>
          <button
            type="button"
            aria-label={t("close")}
            onClick={onClose}
            className="hover:text-foreground text-[color:var(--muted)] transition"
          >
            ✕
          </button>
        </div>
        <div className="mt-3 max-h-[70vh] overflow-y-auto text-sm text-[color:var(--muted)]">
          {children}
        </div>
      </div>
    </div>
  );
}
