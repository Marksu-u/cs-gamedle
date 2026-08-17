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

export const LAST_UPDATED = new Date("2026-08-17T00:00:00Z");

export const CONTACT_EMAIL = "marc.gapasinpro@gmail.com";

// The host's identity
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

// Where the player data came from. Waiting on a better/automated way to update data.
export const DATA_SOURCE = "https://www.hltv.org/";

// Public source repository
export const SOURCE_REPO = "github.com/Marksu-u/cs-gamedle";

export const X_HANDLE = "marksu_u";
export const X_URL = `https://x.com/${X_HANDLE}`;

// Counts quoted in the privacy policy
import guessrData from "@/app/data/cs2/guessr_players.json";
import molData from "@/app/data/cs2/more-or-lessr.json";

export const PLAYER_COUNT = new Set([
  ...guessrData.players.map((p) => p.name.toLowerCase()),
  ...molData.players.map((p) => p.name.toLowerCase()),
]).size;
