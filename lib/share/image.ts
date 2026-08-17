"use client";

// Painting a result card onto a canvas.
//
// A canvas rather than an <img> of something server-rendered: the whole game
// runs out of localStorage with no network, and a share that needed a
// round-trip would be the one part of it that fails on a train.
//
// Tiles are drawn as rectangles, not as the emoji from emoji.ts. Emoji are the
// right answer for text — they survive any client — but on a canvas they render
// in whatever emoji font the OS ships, at whatever metrics it likes, and the
// grid stops lining up. Rectangles are the same picture everywhere.
//
// The palette is duplicated from app/cs2-theme.css, exactly as
// app/opengraph-image.tsx duplicates it: a canvas has no stylesheet and no
// custom properties. cs2-theme.css is the copy both of these follow.

import type { CardRow, ShareCard } from "@/lib/share/card";
import type { Tone } from "@/lib/share/emoji";

const BG = "#0e0f12";
const BORDER = "#2a2d34";
const TEXT = "#e8e8e8";
const MUTED = "#9aa0a8";
const ACCENT = "#e8922e";

const CELL_COLOUR: Record<Tone, string> = {
  correct: "#6aaa64",
  present: "#d8a93b",
  absent: "#3a3d44",
  missed: "#c2402f",
  right: "#6aaa64",
  wrong: "#c2402f",
  blank: "#22252b",
};

// Rendered at 2× and left there. Not `devicePixelRatio`: the image is going to
// somebody else's screen, and whether it is crisp should not depend on which
// machine happened to produce it.
const SCALE = 2;

const PAD = 26;
const CELL = 30;
const GAP = 5;
const LABEL_GAP = 10;

const TITLE_SIZE = 23;
const DETAIL_SIZE = 14;
const LABEL_SIZE = 12;
const URL_SIZE = 13;

const TITLE_TO_DETAIL = 9;
const DETAIL_TO_GRID = 16;
const GRID_TO_URL = 18;

const MIN_WIDTH = 360;

const BODY_FONT =
  "system-ui, -apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif";

// next/font exposes Saira Condensed as a custom property on <html> (see
// app/[locale]/layout.tsx). Reading it keeps the card's title in the same face
// as the page it came from; when it is missing the body stack is no worse than
// what the rest of the card already uses.
function displayFont(): string {
  try {
    const value = getComputedStyle(document.documentElement)
      .getPropertyValue("--font-saira-condensed")
      .trim();
    return value ? `${value}, ${BODY_FONT}` : BODY_FONT;
  } catch {
    return BODY_FONT;
  }
}

function font(weight: number, size: number, family: string): string {
  return `${weight} ${size}px ${family}`;
}

function rowWidth(row: CardRow, labelWidth: number): number {
  const cells = row.cells.length;
  if (cells === 0) return labelWidth;
  return labelWidth + cells * CELL + (cells - 1) * GAP;
}

function roundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
): void {
  // `roundRect` is recent enough that a browser without it is still plausible,
  // and a thrown method here would cost the whole image.
  if (typeof ctx.roundRect === "function") {
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, r);
    return;
  }
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

/**
 * Paints `card` and hands back a PNG.
 *
 * Rejects rather than returning a placeholder: every caller already has the
 * text share to fall back to, and a blank picture would be worse than none.
 */
export async function renderCard(card: ShareCard): Promise<Blob> {
  if (typeof document === "undefined") {
    throw new Error("renderCard needs a document");
  }

  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("no 2d context");

  const display = displayFont();
  const titleFont = font(700, TITLE_SIZE, display);

  // Web fonts load lazily, and a canvas is not a reason for the browser to fetch
  // one — `fonts.ready` alone resolves happily on a page where the display face
  // was never requested at this weight, and the card then measures the fallback
  // and draws it. Asking for the exact font first is what makes the picture the
  // same one twice running.
  try {
    await document.fonts?.load(titleFont);
    await document.fonts?.ready;
  } catch {
    // An engine without the Font Loading API draws with whatever it has.
  }
  const detailFont = font(600, DETAIL_SIZE, BODY_FONT);
  const labelFont = font(600, LABEL_SIZE, BODY_FONT);
  const urlFont = font(600, URL_SIZE, BODY_FONT);

  const measure = (text: string, withFont: string) => {
    ctx.font = withFont;
    return ctx.measureText(text).width;
  };

  // The day recap labels its rows and the three game modes do not; one measured
  // column keeps every grid in a card starting at the same x.
  const labelWidth = card.rows.some((r) => r.label !== undefined)
    ? Math.max(
        ...card.rows.map((r) =>
          r.label ? measure(r.label, labelFont) + LABEL_GAP : 0,
        ),
      )
    : 0;

  const content = Math.max(
    MIN_WIDTH - PAD * 2,
    measure(card.title, titleFont),
    measure(card.detail, detailFont),
    measure(card.url, urlFont),
    ...card.rows.map((row) => rowWidth(row, labelWidth)),
  );

  const gridHeight = card.rows.length
    ? card.rows.length * (CELL + GAP) - GAP
    : 0;

  const width = Math.ceil(content + PAD * 2);
  const height = Math.ceil(
    PAD +
      TITLE_SIZE +
      TITLE_TO_DETAIL +
      DETAIL_SIZE +
      DETAIL_TO_GRID +
      gridHeight +
      GRID_TO_URL +
      URL_SIZE +
      PAD,
  );

  canvas.width = width * SCALE;
  canvas.height = height * SCALE;
  ctx.scale(SCALE, SCALE);

  ctx.fillStyle = BG;
  ctx.fillRect(0, 0, width, height);

  // A hairline inside the edge, so the card still reads as a card against the
  // dark background of a Discord message.
  ctx.strokeStyle = BORDER;
  ctx.lineWidth = 1;
  roundedRect(ctx, 0.5, 0.5, width - 1, height - 1, 12);
  ctx.stroke();

  ctx.textBaseline = "top";

  let y = PAD;

  ctx.font = titleFont;
  ctx.fillStyle = TEXT;
  ctx.fillText(card.title, PAD, y);
  y += TITLE_SIZE + TITLE_TO_DETAIL;

  ctx.font = detailFont;
  ctx.fillStyle = MUTED;
  ctx.fillText(card.detail, PAD, y);
  y += DETAIL_SIZE + DETAIL_TO_GRID;

  for (const row of card.rows) {
    if (row.label !== undefined) {
      ctx.font = labelFont;
      ctx.fillStyle = MUTED;
      // Centred against the tiles rather than sat on their top edge.
      ctx.fillText(row.label, PAD, y + (CELL - LABEL_SIZE) / 2);
    }
    row.cells.forEach((cell, i) => {
      const x = PAD + labelWidth + i * (CELL + GAP);
      ctx.fillStyle = CELL_COLOUR[cell];
      roundedRect(ctx, x, y, CELL, CELL, 5);
      ctx.fill();
      // An unplayed slot is nearly the background colour, which reads as a hole
      // rather than as a tile still to come. The outline puts it back on the
      // grid without giving it the weight of a played one.
      if (cell === "blank") {
        ctx.strokeStyle = BORDER;
        ctx.lineWidth = 1;
        ctx.stroke();
      }
    });
    y += CELL + GAP;
  }
  y += (card.rows.length ? -GAP : 0) + GRID_TO_URL;

  // The link is the reason the picture exists: an image pasted into a chat is
  // not clickable, so the address has to be legible inside it.
  ctx.font = urlFont;
  ctx.fillStyle = ACCENT;
  ctx.fillText(card.url, PAD, y);

  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error("toBlob returned nothing"));
    }, "image/png");
  });
}
