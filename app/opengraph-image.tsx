import { ImageResponse } from "next/og";
import { getTranslations } from "next-intl/server";
import { locales, type Locale } from "@/i18n/routing";
import { SITE_NAME } from "@/lib/seo";

// Share preview image for social networks and messaging apps. Generated at
// build time rather than stored as a PNG: no binary asset to regenerate when
// the wording changes, and it stays consistent with the theme.
//
// One image PER LOCALE, addressed as /opengraph-image/en and
// /opengraph-image/fr. It lives at the app root rather than under [locale] on
// purpose: inside the locale segment the unprefixed English URL would go
// through the i18n middleware, which redirects on Accept-Language — so a French
// crawler fetching the English page's share image would be handed the French
// one. At the root the path is excluded from the middleware entirely and each
// URL serves exactly the language it names.

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// Palette copied from app/cs2-theme.css. Hardcoded here because
// `ImageResponse` renders outside the browser, with no CSS and no variables.
const ACCENT = "#f5a623";
const ACCENT_HOT = "#e8562a";
const TEXT = "#f2f3f5";
const MUTED = "#8b8f98";

export async function generateImageMetadata() {
  return Promise.all(
    locales.map(async (locale) => {
      const t = await getTranslations({ locale, namespace: "seo" });
      return {
        id: locale,
        size,
        contentType,
        alt: `${SITE_NAME} — ${t("home.description")}`,
      };
    }),
  );
}

export default async function Image({ id }: { id: string }) {
  const locale = id as Locale;
  const t = await getTranslations({ locale, namespace: "seo" });
  const modes = await getTranslations({ locale, namespace: "modes" });

  // Literal keys, never a template: a key built from a variable renders as its
  // own raw path when it misses, and an image cannot be checked by the render
  // tests that guard the rest of the catalogue.
  const badges = [
    t("ogBadges.rotation"),
    t("ogBadges.streak"),
    t("ogBadges.score"),
  ];
  const eyebrow = [
    modes("wordle.label"),
    modes("guessr.label"),
    modes("more-or-lessr.label"),
  ].join(" · ");

  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        // OPAQUE gradient stops. Satori composites alpha stops against white
        // rather than the background, which washed the image out.
        background:
          "linear-gradient(115deg, #0e0f12 0%, #0e0f12 56%, #241310 78%, #3d1c12 100%)",
        padding: "72px 80px",
        fontFamily: "sans-serif",
      }}
    >
      <div
        style={{
          display: "flex",
          fontSize: 26,
          letterSpacing: 10,
          color: MUTED,
          textTransform: "uppercase",
        }}
      >
        {eyebrow}
      </div>

      {/* Stacked wordmark like the site hero: "COUNTER" then "STRIKE 2". On a
            single line "COUNTER-STRIKE" overflows and breaks the layout. The
            wordmark is the game's name, identical in every language. */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          marginTop: 14,
          lineHeight: 0.92,
        }}
      >
        <div
          style={{
            display: "flex",
            fontSize: 104,
            fontWeight: 800,
            color: TEXT,
          }}
        >
          COUNTER
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <div
            style={{
              display: "flex",
              fontSize: 104,
              fontWeight: 800,
              color: TEXT,
            }}
          >
            STRIKE
          </div>
          <div
            style={{
              display: "flex",
              fontSize: 128,
              fontWeight: 800,
              color: ACCENT_HOT,
            }}
          >
            2
          </div>
        </div>
      </div>

      <div
        style={{ display: "flex", fontSize: 38, color: TEXT, marginTop: 30 }}
      >
        {t("ogTagline")}
      </div>

      <div
        style={{
          display: "flex",
          gap: 18,
          marginTop: 44,
          fontSize: 27,
          color: MUTED,
        }}
      >
        {badges.map((label) => (
          <div
            key={label}
            style={{
              display: "flex",
              border: "2px solid rgba(245,166,35,0.38)",
              borderRadius: 12,
              padding: "12px 22px",
              color: ACCENT,
            }}
          >
            {label}
          </div>
        ))}
      </div>
    </div>,
    size,
  );
}
