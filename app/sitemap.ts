import type { MetadataRoute } from "next";
import { PAGES, pageUrl } from "@/lib/seo";

export default function sitemap(): MetadataRoute.Sitemap {
  // Le contenu change tous les jours à 3h UTC, d'où `daily`. La liste vient de
  // `lib/seo.ts`, la même que les métadonnées : une page ne peut pas être
  // référencée d'un côté et oubliée de l'autre.
  return PAGES.map((p) => ({
    url: pageUrl(p.path),
    changeFrequency: "daily" as const,
    priority: p.priority,
  }));
}
