import { getRequestConfig } from "next-intl/server";
import { hasLocale } from "next-intl";
import { routing } from "./routing";

// Resolves the locale for each server render and loads its messages.
export default getRequestConfig(async ({ requestLocale }) => {
  const requested = await requestLocale;
  // `hasLocale` guards against a bogus segment such as /de/wordle before it
  // reaches the import below, which would otherwise throw on a missing file.
  const locale = hasLocale(routing.locales, requested)
    ? requested
    : routing.defaultLocale;

  return {
    locale,
    messages: (await import(`../messages/${locale}.json`)).default,
    // Pinned rather than left to the server's zone. The whole app already lives
    // on UTC — the puzzle rotates at 03:00 UTC — so a date formatted in any
    // other zone would disagree with the day it describes. It also keeps these
    // statically rendered pages deterministic instead of stamped with whatever
    // zone the build machine happened to be in.
    timeZone: "UTC",
  };
});
