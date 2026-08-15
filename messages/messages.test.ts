import { describe, expect, it } from "vitest";
import { locales, defaultLocale } from "@/i18n/routing";
import en from "./en.json";
import fr from "./fr.json";

const catalogues: Record<string, unknown> = { en, fr };

// Flattens { a: { b: "x" } } to ["a.b"], so two catalogues can be compared as
// flat key lists rather than by walking nested objects.
function keys(value: unknown, prefix = ""): string[] {
  if (typeof value !== "object" || value === null) return [prefix];
  return Object.entries(value).flatMap(([k, v]) =>
    keys(v, prefix ? `${prefix}.${k}` : k),
  );
}

// Placeholders such as {count} or an ICU plural argument. A translation that
// drops one renders a literal gap; one that invents another throws at runtime.
//
// The identifier must be followed by `,` or `}` so that literal text inside a
// plural branch — `=0 {no hints}` — is not mistaken for an argument named "no".
function placeholders(text: string): string[] {
  return [...text.matchAll(/\{(\w+)\s*[,}]/g)].map((m) => m[1]).sort();
}

function flatten(value: unknown, prefix = ""): Record<string, string> {
  if (typeof value === "string") return { [prefix]: value };
  if (typeof value !== "object" || value === null) return {};
  return Object.entries(value).reduce<Record<string, string>>(
    (acc, [k, v]) => ({
      ...acc,
      ...flatten(v, prefix ? `${prefix}.${k}` : k),
    }),
    {},
  );
}

describe("translation catalogues", () => {
  it("every declared locale has its file", () => {
    for (const l of locales) expect(catalogues[l]).toBeDefined();
  });

  const reference = keys(catalogues[defaultLocale]).sort();

  it.each(locales.filter((l) => l !== defaultLocale))(
    "%s has exactly the same keys as the default locale",
    (locale) => {
      const autres = keys(catalogues[locale]).sort();
      const manquantes = reference.filter((k) => !autres.includes(k));
      const enTrop = autres.filter((k) => !reference.includes(k));
      expect({ manquantes, enTrop }).toEqual({ manquantes: [], enTrop: [] });
    },
  );

  it.each(locales)("%s : no empty values", (locale) => {
    const vides = Object.entries(flatten(catalogues[locale]))
      .filter(([, v]) => !v.trim())
      .map(([k]) => k);
    expect(vides).toEqual([]);
  });

  it.each(locales.filter((l) => l !== defaultLocale))(
    "%s : same interpolation variables as the reference",
    (locale) => {
      const ref = flatten(catalogues[defaultLocale]);
      const cible = flatten(catalogues[locale]);
      const divergences = Object.keys(ref)
        .filter(
          (k) =>
            cible[k] !== undefined &&
            placeholders(ref[k]).join() !== placeholders(cible[k]).join(),
        )
        .map(
          (k) =>
            `${k} : ${placeholders(ref[k]).join(",")} vs ${placeholders(cible[k]).join(",")}`,
        );
      expect(divergences).toEqual([]);
    },
  );
});
