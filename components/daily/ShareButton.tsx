"use client";

import { useTranslations } from "next-intl";
import { useShare } from "@/lib/share/useShare";

type Props = {
  text: string;
  disabled?: boolean;
  className?: string;
};

const BASE =
  "rounded-lg border border-white/15 bg-white/5 px-4 py-2 text-xs font-semibold tracking-widest uppercase transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-white/5";

export default function ShareButton({ text, disabled, className }: Props) {
  const t = useTranslations("share");
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
      onClick={() => void share(text)}
      // The label IS the feedback, so a screen reader has to hear it change.
      aria-live="polite"
      className={className ? `${BASE} ${className}` : BASE}
    >
      {label}
    </button>
  );
}
