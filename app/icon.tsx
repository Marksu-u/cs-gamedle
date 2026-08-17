import { ImageResponse } from "next/og";

// Tab icon, generated rather than stored as a binary — same reasoning as
// opengraph-image.tsx: nothing to re-export by hand when the palette moves.
//
// The mark is a 2x2 Wordle grid rather than a wordmark or the CS crosshair. At
// 32px a wordmark is unreadable, and a crosshair says "shooter" rather than
// "daily puzzle"; the coloured tiles read at 16px and match the emoji grid the
// share button produces, which is the thing players actually recognise.

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

// Palette copied from app/cs2-theme.css: ImageResponse renders outside the
// browser, with no CSS and no variables.
const BACKGROUND = "#0e0f12";
const CORRECT = "#6aaa64";
const PRESENT = "#d8a93b";
const ABSENT = "#3a3d44";

// Reading order: two hits, a near miss, a blank — a plausible board rather than
// a decorative arrangement.
const TILES = [CORRECT, PRESENT, ABSENT, CORRECT];

export default function Icon() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexWrap: "wrap",
        alignContent: "center",
        justifyContent: "center",
        gap: 2,
        background: BACKGROUND,
        padding: 3,
      }}
    >
      {TILES.map((colour, i) => (
        <div
          key={i}
          style={{
            display: "flex",
            width: 12,
            height: 12,
            borderRadius: 2,
            background: colour,
          }}
        />
      ))}
    </div>,
    size,
  );
}
