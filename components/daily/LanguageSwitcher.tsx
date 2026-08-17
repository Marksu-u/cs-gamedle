"use client";

import { useLocale, useTranslations } from "next-intl";
import { usePathname, useRouter } from "@/i18n/navigation";
import { LOCALE_LABELS, locales, type Locale } from "@/i18n/routing";

// Language switcher.
//
// `usePathname` from i18n/navigation returns the path WITHOUT the locale
// prefix, so pushing it with a new locale keeps the player on the same page
// instead of dropping them back on the home page.
export default function LanguageSwitcher() {
  const current = useLocale();
  const pathname = usePathname();
  const router = useRouter();
  const t = useTranslations("nav");

  return (
    <div
      className="inline-flex items-center gap-0.5 rounded-lg border border-[color:var(--border)] bg-[var(--surface)] p-0.5"
      role="group"
      aria-label={t("language")}
    >
      {locales.map((locale) => {
        const active = locale === current;
        return (
          <button
            key={locale}
            type="button"
            // The switcher is visible on every page, so the label alone
            // ("EN", "FR") is too terse for a screen reader.
            aria-label={LOCALE_LABELS[locale as Locale]}
            aria-current={active ? "true" : undefined}
            onClick={() => router.replace(pathname, { locale })}
            className={`rounded-md px-2.5 py-1 text-xs font-semibold tracking-wider uppercase transition ${
              active
                ? "bg-[var(--accent)] text-black"
                : "text-[color:var(--muted)] hover:text-foreground"
            }`}
          >
            {locale}
          </button>
        );
      })}
    </div>
  );
}
