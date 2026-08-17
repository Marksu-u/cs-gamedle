import { ImageResponse } from "next/og";
import { SITE_NAME } from "@/lib/seo";

// Share preview image for social networks and messaging apps. Generated at
// build time rather than stored as a PNG: no binary asset to regenerate when
// the wording changes, and it stays consistent with the theme.
export const alt = `${SITE_NAME} — 9 grilles quotidiennes Counter-Strike 2`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// Palette copied from app/cs2-theme.css. Hardcoded here because
// `ImageResponse` renders outside the browser, with no CSS and no variables.
const ACCENT = "#f5a623";
const ACCENT_HOT = "#e8562a";
const TEXT = "#f2f3f5";
const MUTED = "#8b8f98";

export default function Image() {
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
        Wordle · Guessr · More or Lessr
      </div>

      {/* Stacked wordmark like the site hero: "COUNTER" then "STRIKE 2". On a
          single line "COUNTER-STRIKE" overflows and breaks the layout. */}
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
        9 grilles par jour, les mêmes pour tout le monde
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
        {["Rotation à 3h UTC", "Série", "Score & record"].map((t) => (
          <div
            key={t}
            style={{
              display: "flex",
              border: "2px solid rgba(245,166,35,0.38)",
              borderRadius: 12,
              padding: "12px 22px",
              color: ACCENT,
            }}
          >
            {t}
          </div>
        ))}
      </div>
    </div>,
    size,
  );
}
