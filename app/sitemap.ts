import type { MetadataRoute } from "next";
import { defaultLocale, locales } from "@/i18n/routing";
import { ROUTES, localePath, pageUrl } from "@/lib/seo";

export default function sitemap(): MetadataRoute.Sitemap {
  // One entry per route AND per locale, each carrying the full set of language
  // alternates. Listing only one language would leave the others undiscovered
  // until a crawler stumbled on them.
  //
  // Content rotates daily at 3am UTC, hence `daily`. The route list comes from
  // lib/seo.ts, the same one the metadata uses, so a page cannot be referenced
  // in one and forgotten in the other.
  return locales.flatMap((locale) =>
    ROUTES.map((route) => ({
      url: pageUrl(route.path, locale),
      changeFrequency: "daily" as const,
      priority: route.priority,
      alternates: {
        languages: Object.fromEntries([
          ...locales.map((l) => [l, pageUrl(route.path, l)]),
          ["x-default", pageUrl(route.path, defaultLocale)],
        ]),
      },
    })),
  );
}

// Kept for the metadata layer, which needs paths rather than absolute URLs.
export { localePath };
