"use client";

import { useTranslations } from "next-intl";
import type { ShareCard } from "@/lib/share/card";
import { cardToText, type ShareT } from "@/lib/share/format";
import { useShare } from "@/lib/share/useShare";

type Props = {
  card: ShareCard;
  disabled?: boolean;
  className?: string;
};

const BASE =
  "rounded-lg border border-white/15 bg-white/5 px-4 py-2 text-xs font-semibold tracking-widest uppercase transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-white/5";

export default function ShareButton({ card, disabled, className }: Props) {
  const t = useTranslations("share");
  // Root translator: the text rendering addresses the catalogue by full path.
  const root = useTranslations() as unknown as ShareT;
  const { status, share } = useShare();

  // Literal keys either side of the branch — see the note in lib/share/format.ts.
  const label =
    status === "copied"
      ? t("copied")
      : status === "error"
        ? t("failed")
        : t("action");

  return (
    <button
      type="button"
      disabled={disabled}
      // The text is rendered at click time, not per render: it is only ever
      // needed once, and the card it comes from is rebuilt on every keystroke.
      onClick={() => void share({ text: cardToText(card, root), card })}
      // The label IS the feedback, so a screen reader has to hear it change.
      aria-live="polite"
      className={className ? `${BASE} ${className}` : BASE}
    >
      {label}
    </button>
  );
}
