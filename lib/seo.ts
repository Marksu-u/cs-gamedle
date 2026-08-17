import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import {
  defaultLocale,
  locales,
  LOCALE_TAGS,
  type Locale,
} from "@/i18n/routing";

// Shared by metadata, the sitemap, robots.txt and the share image. One place to
// change the day the domain moves.

// The production URL cannot be guessed from the repo, so it comes from the
// environment. The fallback is for dev and tests — if it reaches production the
// Open Graph tags will point at localhost and share previews will be blank.
export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export const SITE_NAME = "CS2 Gamedle";

// Indexable routes. Titles and descriptions live in the message catalogues,
// keyed by these same paths, so a page cannot be listed here and left
// untranslated.
// `changeFrequency` is per route: the games rotate daily, the legal pages change
// when the law or the host does. Telling a crawler the legal notice is daily
// wastes its budget on four pages that never move.
export const ROUTES = [
  { path: "/", key: "home", priority: 1, changeFrequency: "daily" },
  { path: "/wordle", key: "wordle", priority: 0.8, changeFrequency: "daily" },
  { path: "/guessr", key: "guessr", priority: 0.8, changeFrequency: "daily" },
  {
    path: "/more-or-lessr",
    key: "more-or-lessr",
    priority: 0.8,
    changeFrequency: "daily",
  },
  { path: "/legal", key: "legal", priority: 0.2, changeFrequency: "yearly" },
  {
    path: "/privacy",
    key: "privacy",
    priority: 0.2,
    changeFrequency: "yearly",
  },
  { path: "/terms", key: "terms", priority: 0.2, changeFrequency: "yearly" },
  {
    path: "/cookies",
    key: "cookies",
    priority: 0.2,
    changeFrequency: "yearly",
  },
] as const;

// The four pages linked from the footer, in display order.
export const LEGAL_PATHS = [
  "/legal",
  "/privacy",
  "/terms",
  "/cookies",
] as const;

export type LegalPath = (typeof LEGAL_PATHS)[number];

export type RoutePath = (typeof ROUTES)[number]["path"];

// The default locale is unprefixed (`/wordle`), the others are prefixed
// (`/fr/wordle`) — matching `localePrefix: "as-needed"` in i18n/routing.ts.
export function localePath(path: string, locale: string): string {
  const prefix = locale === defaultLocale ? "" : `/${locale}`;
  return path === "/" ? prefix || "/" : `${prefix}${path}`;
}

export function pageUrl(path: string, locale: string): string {
  const p = localePath(path, locale);
  return p === "/" ? SITE_URL : `${SITE_URL}${p}`;
}

// Full metadata for one page in one locale.
//
// Written here rather than page by page because Next REPLACES the `openGraph`
// and `twitter` objects from the layout instead of merging them field by field.
// A page that declares only a title loses the share image and drops the Twitter
// card back to "summary" — the thumbnail disappears with nothing to signal it.
export async function buildMetadata(
  path: RoutePath,
  locale: string,
): Promise<Metadata> {
  const route = ROUTES.find((r) => r.path === path);
  if (!route) throw new Error(`Unknown route in lib/seo.ts: ${path}`);

  const t = await getTranslations({ locale, namespace: "seo" });
  const title = t(`${route.key}.title`);
  const description = t(`${route.key}.description`);

  const images = [
    { url: "/opengraph-image", width: 1200, height: 630, alt: title },
  ];

  // hreflang: tells search engines these URLs are the same page in different
  // languages, so they rank the right one per user instead of treating them as
  // duplicates. `x-default` points at the language served to everyone else.
  const languages = Object.fromEntries([
    ...locales.map((l) => [l, localePath(path, l)]),
    ["x-default", localePath(path, defaultLocale)],
  ]);

  return {
    metadataBase: new URL(SITE_URL),
    title: { absolute: title },
    description,
    applicationName: SITE_NAME,
    alternates: { canonical: localePath(path, locale), languages },
    openGraph: {
      type: "website",
      locale: LOCALE_TAGS[locale as Locale] ?? LOCALE_TAGS[defaultLocale],
      // Lets a crawler discover the other languages from any one page.
      alternateLocale: locales
        .filter((l) => l !== locale)
        .map((l) => LOCALE_TAGS[l]),
      siteName: SITE_NAME,
      title,
      description,
      url: pageUrl(path, locale),
      images,
    },
    twitter: { card: "summary_large_image", title, description, images },
    robots: { index: true, follow: true },
  };
}
