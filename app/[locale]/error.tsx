"use client";

import { Link } from "@/i18n/navigation";
import { useEffect } from "react";
import { useTranslations } from "next-intl";

// Safety net for any uncaught client render exception. Without this file Next
// shows its generic error screen — no way out, and none of the site's theme.
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const t = useTranslations("errors.unexpected");
  const nav = useTranslations("nav");

  useEffect(() => {
    // No reporting service wired up: the console at least keeps a trace.
    console.error(error);
  }, [error]);

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center px-6 text-center">
      <p className="mb-2 text-xs tracking-[0.25em] text-[color:var(--accent-hot)] uppercase">
        {t("eyebrow")}
      </p>
      <h1 className="cs2-display text-foreground text-4xl font-extrabold uppercase italic">
        {t("title")}
      </h1>
      <p className="mt-3 max-w-[46ch] text-sm text-[color:var(--muted)]">
        {t("body")}
      </p>
      <div className="mt-7 flex gap-3">
        <button
          type="button"
          onClick={reset}
          className="rounded-md bg-[var(--accent)] px-5 py-2 text-xs font-semibold tracking-widest text-black uppercase transition hover:bg-[var(--accent-hot)]"
        >
          {t("retry")}
        </button>
        <Link
          href="/"
          className="rounded-md border border-[color:var(--border)] px-5 py-2 text-xs font-semibold tracking-widest uppercase transition hover:border-[color:var(--accent)]"
        >
          {nav("backToHub")}
        </Link>
      </div>
    </main>
  );
}
