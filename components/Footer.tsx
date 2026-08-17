import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { X_URL } from "@/lib/legal";

// The legal notice has to be "d'accès facile, direct et permanent" (LCEN
// art. 6-III), so this sits in the locale layout and renders under every page —
// not only on the hub.
//
// The four labels are read with literal keys rather than by mapping over the
// paths: a key built from a variable renders as its own raw path when it misses,
// and neither typecheck nor the catalogue test can see that. See Footer.test.tsx.
export default function Footer() {
  const t = useTranslations("footer");

  return (
    <footer className="mt-auto border-t border-[color:var(--border)] px-6 py-6">
      <nav className="mx-auto flex max-w-3xl flex-wrap items-center justify-center gap-x-5 gap-y-2 text-[0.7rem] tracking-[0.15em] text-[color:var(--muted)] uppercase">
        <Link href="/legal" className="hover:text-[color:var(--accent)]">
          {t("legal")}
        </Link>
        <Link href="/privacy" className="hover:text-[color:var(--accent)]">
          {t("privacy")}
        </Link>
        <Link href="/terms" className="hover:text-[color:var(--accent)]">
          {t("terms")}
        </Link>
        <Link href="/cookies" className="hover:text-[color:var(--accent)]">
          {t("cookies")}
        </Link>
        {/* External, so a plain anchor rather than the locale-aware Link. */}
        <a
          href={X_URL}
          target="_blank"
          rel="noopener noreferrer me"
          aria-label={t("xLabel")}
          className="hover:text-[color:var(--accent)]"
        >
          {t("x")}
        </a>
      </nav>
      <p className="mt-4 text-center text-[0.65rem] text-[color:var(--muted)]">
        {t("disclaimer")}
      </p>
    </footer>
  );
}
