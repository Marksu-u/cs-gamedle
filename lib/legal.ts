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
export const PUBLISHER_ALIAS = "MarKsu";

// TODO: replace before going live. Also the GDPR contact for the player dataset,
// so it has to be an address that is actually read.
export const CONTACT_EMAIL = "TODO-contact@example.com";

// TODO: copy verbatim from https://vercel.com/legal — the entity details change,
// and the legal notice is worthless if they are stale.
export const HOST = {
  name: "Vercel Inc.",
  address: "TODO — adresse complète de l'hébergeur",
  phone: "TODO — téléphone de l'hébergeur",
  url: "vercel.com",
} as const;

// Where the player data came from. Named in the legal notice because the EU
// sui generis database right applies to substantial extraction even when the
// individual facts are not copyrightable.
// TODO: confirm this is accurate before going live.
export const DATA_SOURCE = "HLTV.org";

// Counts quoted in the privacy policy. Derived from the shipped datasets rather
// than typed by hand, so the figures cannot go stale when the pools grow.
import guessrData from "@/app/data/cs2/guessr_players.json";
import molData from "@/app/data/cs2/more-or-lessr.json";

export const PLAYER_COUNT = new Set([
  ...guessrData.players.map((p) => p.name.toLowerCase()),
  ...molData.players.map((p) => p.name.toLowerCase()),
]).size;
