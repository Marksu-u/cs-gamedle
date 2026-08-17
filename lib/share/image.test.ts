import { afterEach, describe, expect, it, vi } from "vitest";
import type { ShareCard } from "./card";
import { renderCard } from "./image";

// jsdom ships no canvas implementation, so `getContext` answers null and there
// is nothing to draw on. Rather than pull in the `canvas` package for pixels
// nobody asserts on, the context is faked and the DRAWING CALLS are the subject:
// what the renderer decides (a tile per cell, in the colour its tone maps to, at
// twice the size) is the part that can regress.

type Call = { op: string; args: unknown[]; fillStyle: string };

function fakeCanvas() {
  const calls: Call[] = [];
  const record =
    (op: string) =>
    (...args: unknown[]) =>
      calls.push({ op, args, fillStyle: String(ctx.fillStyle) });

  const ctx = {
    font: "",
    fillStyle: "",
    strokeStyle: "",
    textBaseline: "",
    lineWidth: 0,
    // Width is a stand-in, not a measurement: the layout only needs the widest
    // string to stay the widest one.
    measureText: (text: string) => ({ width: text.length * 7 }),
    scale: record("scale"),
    fillRect: record("fillRect"),
    fillText: record("fillText"),
    beginPath: () => {},
    roundRect: record("roundRect"),
    fill: record("fill"),
    stroke: () => {},
  } as unknown as CanvasRenderingContext2D & { fillStyle: string };

  const canvas = {
    width: 0,
    height: 0,
    getContext: () => ctx,
    toBlob: (cb: (blob: Blob | null) => void) =>
      cb(new Blob(["png"], { type: "image/png" })),
  };

  return { canvas, calls };
}

function useFakeCanvas() {
  const fake = fakeCanvas();
  const real = document.createElement.bind(document);
  vi.spyOn(document, "createElement").mockImplementation((tag: string) =>
    tag === "canvas"
      ? (fake.canvas as unknown as HTMLElement)
      : (real(tag) as HTMLElement),
  );
  return fake;
}

const card: ShareCard = {
  title: "Strikedle — Wordle 5 #12",
  detail: "3/6",
  rows: [
    { cells: ["absent", "present", "correct"] },
    { cells: ["correct", "correct", "correct"] },
  ],
  url: "https://strikedle.com/wordle",
};

const dayCard: ShareCard = {
  title: "Strikedle #12 — 1240 pts",
  detail: "🔥 12",
  rows: [
    { label: "Wordle", cells: ["correct", "missed", "blank"] },
    { label: "Guessr", cells: ["correct"] },
    { label: "More or Lessr", cells: ["present", "blank"] },
  ],
  url: "https://strikedle.com",
};

afterEach(() => {
  vi.restoreAllMocks();
});

describe("renderCard", () => {
  it("hands back a PNG", async () => {
    useFakeCanvas();
    const blob = await renderCard(card);
    expect(blob.type).toBe("image/png");
  });

  it("draws one tile per cell", async () => {
    const fake = useFakeCanvas();
    await renderCard(card);
    const tiles = fake.calls.filter((c) => c.op === "fill");
    expect(tiles).toHaveLength(6);
  });

  it("colours each tile by its tone", async () => {
    const fake = useFakeCanvas();
    await renderCard(card);
    const colours = fake.calls
      .filter((c) => c.op === "fill")
      .map((c) => c.fillStyle);
    // absent, present, correct — then a winning row of three greens.
    expect(colours).toEqual([
      "#3a3d44",
      "#d8a93b",
      "#6aaa64",
      "#6aaa64",
      "#6aaa64",
      "#6aaa64",
    ]);
  });

  it("separates a missed puzzle from a wrong letter", async () => {
    const fake = useFakeCanvas();
    await renderCard(dayCard);
    const colours = fake.calls
      .filter((c) => c.op === "fill")
      .map((c) => c.fillStyle);
    // The 🟥/⬛ distinction emoji.ts insists on has to survive to the picture.
    expect(colours).toContain("#c2402f");
    expect(colours).not.toContain("#3a3d44");
  });

  it("writes the address into the image, since a picture is not clickable", async () => {
    const fake = useFakeCanvas();
    await renderCard(card);
    const drawn = fake.calls
      .filter((c) => c.op === "fillText")
      .map((c) => c.args[0]);
    expect(drawn).toContain(card.url);
    expect(drawn).toContain(card.title);
  });

  it("indents the grid past the labels when the rows are named", async () => {
    const fake = useFakeCanvas();
    await renderCard(dayCard);
    // Width 30 is a tile; the card's own border is drawn with roundRect too.
    const firstTile = fake.calls.find(
      (c) => c.op === "roundRect" && c.args[2] === 30,
    );
    // Left edge of the first tile: past the padding, because a labelled row
    // reserves a column for the mode name.
    expect(Number(firstTile?.args[0])).toBeGreaterThan(26);
  });

  it("renders at twice the layout size, whatever screen produced it", async () => {
    const fake = useFakeCanvas();
    await renderCard(card);
    const scale = fake.calls.find((c) => c.op === "scale");
    expect(scale?.args).toEqual([2, 2]);
    expect(fake.canvas.width % 2).toBe(0);
    expect(fake.canvas.height % 2).toBe(0);
  });

  it("rejects instead of returning a blank picture when there is no context", async () => {
    // The real jsdom behaviour, and the insecure-origin/old-browser case: the
    // caller is expected to fall back to the text share.
    await expect(renderCard(card)).rejects.toThrow();
  });
});
