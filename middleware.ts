import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";

// Picks the locale from the URL, then from the Accept-Language header for a
// first visit, and remembers the choice in a cookie afterwards.
export default createMiddleware(routing);

export const config = {
  // Everything except Next internals, the metadata routes and static files.
  // `sitemap.xml`, `robots.txt` and `opengraph-image` are shared across locales
  // and must not be rewritten under a locale prefix.
  matcher: [
    "/((?!api|_next|_vercel|sitemap.xml|robots.txt|opengraph-image|favicon.ico|.*\\..*).*)",
  ],
};
