import type { Metadata } from "next";

// Configuration partagée par les métadonnées, le sitemap, robots.txt et l'image
// de partage. Un seul endroit à changer le jour où le domaine bouge.

// L'URL de production n'est pas devinable depuis le dépôt : elle vient de
// l'environnement. Le repli sert au dev et aux tests — s'il se retrouve en
// production, les balises Open Graph pointeront vers localhost et les aperçus
// de partage seront vides.
export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export const SITE_NAME = "CS2 Gamedle";

export const SITE_DESCRIPTION =
  "Neuf grilles quotidiennes sur la scène Counter-Strike 2 : Wordle, Guessr et More or Lessr. Nouvelles chaque jour à 3h UTC, les mêmes pour tout le monde.";

// Une entrée par page indexable. Sert aux métadonnées ET au sitemap, pour que
// les deux ne puissent pas diverger.
export const PAGES = [
  {
    path: "/",
    title: "CS2 Gamedle — 9 grilles quotidiennes Counter-Strike 2",
    description: SITE_DESCRIPTION,
    priority: 1,
  },
  {
    path: "/wordle",
    title: "Wordle CS2 — devine le pseudo du jour",
    description:
      "Six grilles par jour, une par longueur de pseudo (3 à 8 lettres). Six essais, indices couleur, une série à tenir.",
    priority: 0.8,
  },
  {
    path: "/guessr",
    title: "Guessr CS2 — devine le joueur pro du jour",
    description:
      "Un joueur pro par jour à retrouver via son équipe, son rôle, sa nationalité, son âge et son palmarès. Essais illimités.",
    priority: 0.8,
  },
  {
    path: "/more-or-lessr",
    title: "More or Lessr CS2 — plus ou moins ?",
    description:
      "Deux pros, une stat cachée : rating HLTV ou prize money. Dix rounds, deux catégories par jour.",
    priority: 0.8,
  },
] as const;

export function pageUrl(path: string): string {
  return path === "/" ? SITE_URL : `${SITE_URL}${path}`;
}

// Métadonnées complètes d'une page.
//
// À écrire ici et pas page par page : Next REMPLACE les objets `openGraph` et
// `twitter` du layout au lieu de les fusionner champ par champ. Une page qui
// déclare juste un titre perd donc l'image de partage et repasse la carte
// Twitter en « summary » — la vignette disparaît sans que rien ne le signale.
export function pageMetadata(path: string): Metadata {
  const page = PAGES.find((p) => p.path === path);
  if (!page) throw new Error(`Page inconnue dans lib/seo.ts : ${path}`);

  const images = [
    {
      url: "/opengraph-image",
      width: 1200,
      height: 630,
      alt: `${SITE_NAME} — ${page.title}`,
    },
  ];

  return {
    // `absolute` court-circuite le gabarit « %s — CS2 Gamedle » du layout : les
    // titres ci-dessus sont déjà complets, le suffixe les ferait bégayer
    // (« Wordle CS2 — devine le pseudo du jour — CS2 Gamedle »).
    title: { absolute: page.title },
    description: page.description,
    alternates: { canonical: page.path },
    openGraph: {
      type: "website",
      locale: "fr_FR",
      siteName: SITE_NAME,
      title: page.title,
      description: page.description,
      url: pageUrl(page.path),
      images,
    },
    twitter: {
      card: "summary_large_image",
      title: page.title,
      description: page.description,
      images,
    },
  };
}
