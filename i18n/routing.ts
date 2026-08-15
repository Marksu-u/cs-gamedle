import { defineRouting } from "next-intl/routing";

// Supported locales. Adding one means: a value here, a messages/<code>.json
// file, and an entry in LOCALE_LABELS below. Nothing else.
export const locales = ["en", "fr"] as const;
export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = "en";

// Shown in the language switcher, in each language's own name — a French
// speaker looks for "Francais", not "French".
export const LOCALE_LABELS: Record<Locale, string> = {
  en: "English",
  fr: "Français",
};

// Used for the `lang` attribute and Open Graph, where the region matters.
export const LOCALE_TAGS: Record<Locale, string> = {
  en: "en_US",
  fr: "fr_FR",
};

export const routing = defineRouting({
  locales,
  defaultLocale,
  // English stays unprefixed (`/wordle`), other locales are prefixed
  // (`/fr/wordle`). This keeps the canonical URLs already published in the
  // sitemap and makes English the default for anyone arriving without a
  // preference.
  localePrefix: "as-needed",
});
