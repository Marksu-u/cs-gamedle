import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";

// Picks the locale from the URL, then from the Accept-Language header for a
// first visit, and remembers the choice in a cookie afterwards.
export default createMiddleware(routing);

export const config = {
  // Everything except Next internals, the metadata routes and static files.
  // `sitemap.xml`, `robots.txt`, the share image and the icons are shared across
  // locales and must not be rewritten under a locale prefix.
  //
  // Every generated metadata route has to be listed here by name. They carry no
  // file extension, so the trailing `.*\\..*` guard does not catch them, and a
  // missing one is rewritten to `/en/icon` and serves a 404 — with the <link>
  // tag still present in the HTML, so nothing looks wrong until you open a tab
  // and see no icon.
  matcher: [
    "/((?!api|_next|_vercel|sitemap.xml|robots.txt|opengraph-image|icon|apple-icon|favicon.ico|.*\\..*).*)",
  ],
};
