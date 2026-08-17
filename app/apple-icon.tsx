import { ImageResponse } from "next/og";

// Home-screen icon for iOS. Same mark as app/icon.tsx, redrawn rather than
// scaled: iOS renders this at 180px on an opaque tile, so the gaps and corner
// radii that read at 32px look mean at that size.

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

const BACKGROUND = "#0e0f12";
const CORRECT = "#6aaa64";
const PRESENT = "#d8a93b";
const ABSENT = "#3a3d44";

const TILES = [CORRECT, PRESENT, ABSENT, CORRECT];

export default function AppleIcon() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexWrap: "wrap",
        alignContent: "center",
        justifyContent: "center",
        gap: 10,
        background: BACKGROUND,
        padding: 26,
      }}
    >
      {TILES.map((colour, i) => (
        <div
          key={i}
          style={{
            display: "flex",
            width: 59,
            height: 59,
            borderRadius: 12,
            background: colour,
          }}
        />
      ))}
    </div>,
    size,
  );
}
