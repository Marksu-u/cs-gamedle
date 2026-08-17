import { describe, expect, it, vi } from "vitest";
import { locales } from "@/i18n/routing";

// Under vitest, `next-intl/server` resolves to its client stub, which throws on
// sight. The assertions below are about routing and image URLs, not wording, so
// the translator is replaced by one that echoes the key back.
vi.mock("next-intl/server", () => ({
  getTranslations: async () => (key: string) => key,
}));

const { buildMetadata, localePath, pageUrl, ROUTES } = await import("./seo");

describe("localePath", () => {
  it("leaves the default locale unprefixed", () => {
    expect(localePath("/wordle", "en")).toBe("/wordle");
    expect(localePath("/", "en")).toBe("/");
  });

  it("prefixes the others", () => {
    expect(localePath("/wordle", "fr")).toBe("/fr/wordle");
    expect(localePath("/", "fr")).toBe("/fr");
  });
});

describe("ROUTES", () => {
  it("has an seo entry for every route in both catalogues", async () => {
    // The keys are looked up as `${route.key}.title` inside buildMetadata, from
    // a variable — the one shape that renders as its own raw path when it
    // misses. Listing a route here and forgetting its strings is the mistake
    // this catches.
    const en = (await import("@/messages/en.json")).default as Record<
      string,
      Record<string, unknown>
    >;
    const fr = (await import("@/messages/fr.json")).default as Record<
      string,
      Record<string, unknown>
    >;
    for (const route of ROUTES) {
      expect(en.seo, `en is missing seo.${route.key}`).toHaveProperty(
        route.key,
      );
      expect(fr.seo, `fr is missing seo.${route.key}`).toHaveProperty(
        route.key,
      );
    }
  });

  it("gives the legal pages a lower priority than the games", () => {
    const legal = ROUTES.find((r) => r.path === "/legal");
    const home = ROUTES.find((r) => r.path === "/");
    expect(legal!.priority).toBeLessThan(home!.priority);
  });
});

describe("buildMetadata", () => {
  // The share image is generated per locale (app/opengraph-image.tsx). Pointing
  // every locale at one shared URL is exactly the bug this replaced: the tags
  // still validate, the preview still renders, and it is simply in the wrong
  // language for half the audience.
  it.each(locales)("points %s at its own share image", async (locale) => {
    const meta = await buildMetadata("/", locale);
    const images = meta.openGraph?.images as { url: string }[];
    expect(images[0].url).toBe(`/opengraph-image/${locale}`);
  });

  it("gives each locale a distinct image URL", async () => {
    const urls = await Promise.all(
      locales.map(async (l) => {
        const meta = await buildMetadata("/", l);
        return (meta.openGraph?.images as { url: string }[])[0].url;
      }),
    );
    expect(new Set(urls).size).toBe(locales.length);
  });

  it("builds an absolute URL for the canonical page", () => {
    expect(pageUrl("/wordle", "fr")).toMatch(/\/fr\/wordle$/);
  });
});
