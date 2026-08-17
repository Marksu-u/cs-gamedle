// The identity block behind the legal pages.
//
// Deliberately NOT in the message catalogues: none of it is translated, so
// keeping it here makes filling it in a single edit instead of four, and stops
// the two catalogues drifting on a value that has to match exactly.
//
// The site is published under the NON-PROFESSIONAL regime of article 6-III-2 of
// the LCEN: an individual publishing a free, non-commercial site may keep their
// name and address off the page, provided the host holds them. That is why no
// real name, postal address, phone number or SIREN appears anywhere below.
//
// This stops being true the day the site earns anything — advertising, a
// donation button, sponsorship, a paid tier. Any of those makes the publisher
// professional under 6-III-1, and the page then has to carry full identity.

// Shown as the publication director. A pseudonym is enough under 6-III-2.
export const PUBLISHER_ALIAS = "marksu_u";

// Date shown on all four pages. One constant rather than four literals: the
// whole point of the line is to tell a reader which version they are looking at,
// which fails the moment the pages disagree. Bump it whenever the wording
// changes in a way that matters.
export const LAST_UPDATED = new Date("2026-08-17T00:00:00Z");

// TODO: replace before going live. Also the GDPR contact for the player dataset,
// so it has to be an address that is actually read.
export const CONTACT_EMAIL = "TODO-contact@example.com";

// The host's identity is the one piece of content the LCEN actually compels on
// this page, so it is the one worth getting exactly right.
//
// TODO: check these against https://vercel.com/legal before going live — the
// entity details change, and a stale host address is what makes a notice
// non-compliant.
//
// The statute names the host's TELEPHONE number specifically. Fill `phone` in if
// the host publishes one; leave it `null` if it genuinely does not, and the
// sentence simply omits it. Never invent a number — a wrong one is worse than an
// absent one. `email` is shown either way, as a contact route.
export const HOST: {
  name: string;
  address: string;
  phone: string | null;
  email: string | null;
  url: string;
} = {
  name: "Vercel Inc.",
  address: "440 N Barranca Avenue #4133 Covina, CA 91723 United States",
  phone: null,
  email: "privacy@vercel.com",
  url: "vercel.com",
};

// Where the player data came from. Named in the legal notice because the EU
// sui generis database right applies to substantial extraction even when the
// individual facts are not copyrightable.
// TODO: confirm this is accurate before going live.
export const DATA_SOURCE = "https://www.hltv.org/";

// Public source repository. Named in the legal notice because the IP clause has
// to agree with the LICENSE file in it: the two contradicting each other is the
// failure mode this constant exists to prevent.
export const SOURCE_REPO = "github.com/Marksu-u/cs-gamedle";

export const X_HANDLE = "marksu_u";
export const X_URL = `https://x.com/${X_HANDLE}`;

// Counts quoted in the privacy policy. Derived from the shipped datasets rather
// than typed by hand, so the figures cannot go stale when the pools grow.
import guessrData from "@/app/data/cs2/guessr_players.json";
import molData from "@/app/data/cs2/more-or-lessr.json";

export const PLAYER_COUNT = new Set([
  ...guessrData.players.map((p) => p.name.toLowerCase()),
  ...molData.players.map((p) => p.name.toLowerCase()),
]).size;
