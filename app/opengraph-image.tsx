import { ImageResponse } from "next/og";
import { SITE_NAME } from "@/lib/seo";

// Image d'aperçu partagée sur les réseaux et les messageries. Générée au build
// plutôt que stockée en PNG : pas d'asset binaire à régénérer quand le texte
// change, et elle reste cohérente avec le thème.
export const alt = `${SITE_NAME} — 9 grilles quotidiennes Counter-Strike 2`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// Palette reprise de app/cs2-theme.css. En dur ici : `ImageResponse` rend hors
// du navigateur, sans CSS ni variables.
const FOND = "#0e0f12";
const ACCENT = "#f5a623";
const ACCENT_CHAUD = "#e8562a";
const TEXTE = "#f2f3f5";
const ATTENUE = "#8b8f98";

export default function Image() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        // Dégradé en couleurs OPAQUES. Satori compose les stops alpha sur du blanc
        // et non sur le fond : toute transparence délavait l'image.
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
          color: ATTENUE,
          textTransform: "uppercase",
        }}
      >
        Wordle · Guessr · More or Lessr
      </div>

      {/* Titre empilé comme le hero du site : « COUNTER » puis « STRIKE 2 ».
          Sur une seule ligne, « COUNTER-STRIKE » déborde et casse la mise en page. */}
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
            color: TEXTE,
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
              color: TEXTE,
            }}
          >
            STRIKE
          </div>
          <div
            style={{
              display: "flex",
              fontSize: 128,
              fontWeight: 800,
              color: ACCENT_CHAUD,
            }}
          >
            2
          </div>
        </div>
      </div>

      <div
        style={{ display: "flex", fontSize: 38, color: TEXTE, marginTop: 30 }}
      >
        9 grilles par jour, les mêmes pour tout le monde
      </div>

      <div
        style={{
          display: "flex",
          gap: 18,
          marginTop: 44,
          fontSize: 27,
          color: ATTENUE,
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
