import { act, renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { ShareCard } from "./card";
import { renderCard } from "./image";
import { useShare } from "./useShare";

// The canvas is stubbed out: jsdom cannot draw, and what this file is about is
// which ROUTE a share takes — image, then text, then a label — not what the
// picture looks like. That is image.test.ts.
vi.mock("./image", () => ({
  renderCard: vi.fn(),
}));

// jsdom has neither `navigator.clipboard` nor a working `execCommand`, which is
// exactly the insecure-origin case. Each test adds back only what it needs.
const clipboardDescriptor = Object.getOwnPropertyDescriptor(
  navigator,
  "clipboard",
);

function stub(key: string, value: unknown) {
  Object.defineProperty(navigator, key, {
    value,
    configurable: true,
    writable: true,
  });
}

function onTouchDevice() {
  vi.stubGlobal("matchMedia", () => ({ matches: true }));
}

// Enough of the real thing to record what was handed to it.
class FakeClipboardItem {
  constructor(readonly types: Record<string, Blob | Promise<Blob>>) {}
}

function withImageClipboard() {
  const write = vi.fn().mockResolvedValue(undefined);
  vi.stubGlobal("ClipboardItem", FakeClipboardItem);
  stub("clipboard", { write, writeText: vi.fn().mockResolvedValue(undefined) });
  return write;
}

const card: ShareCard = {
  title: "Strikedle — Wordle 5 #12",
  detail: "3/6",
  rows: [{ cells: ["correct", "correct", "correct"] }],
  url: "https://strikedle.com/wordle",
};

beforeEach(() => {
  vi.mocked(renderCard).mockResolvedValue(
    new Blob(["png"], { type: "image/png" }),
  );
});

afterEach(() => {
  Reflect.deleteProperty(navigator, "share");
  Reflect.deleteProperty(navigator, "canShare");
  if (clipboardDescriptor) {
    Object.defineProperty(navigator, "clipboard", clipboardDescriptor);
  } else {
    Reflect.deleteProperty(navigator, "clipboard");
  }
  vi.unstubAllGlobals();
  vi.clearAllMocks();
});

async function shareOnce(text = "hello") {
  const { result } = renderHook(() => useShare());
  await act(async () => {
    await result.current.share({ text, card });
  });
  return result;
}

describe("useShare", () => {
  it("reports failure instead of throwing when nothing can copy", async () => {
    const result = await shareOnce();
    expect(result.current.status).toBe("error");
  });

  it("puts the picture and the text on the clipboard as one item", async () => {
    const write = withImageClipboard();
    const result = await shareOnce();

    const item = write.mock.calls[0][0][0] as FakeClipboardItem;
    // Both types, one item: the destination picks, and the link in the text is
    // never dropped on the way.
    expect(Object.keys(item.types).sort()).toEqual(["image/png", "text/plain"]);
    expect(result.current.status).toBe("copied");
  });

  it("falls back to the text when the clipboard refuses the image", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal("ClipboardItem", FakeClipboardItem);
    stub("clipboard", {
      write: vi.fn().mockRejectedValue(new Error("unsupported type")),
      writeText,
    });
    const result = await shareOnce();
    expect(writeText).toHaveBeenCalledWith("hello");
    expect(result.current.status).toBe("copied");
  });

  it("falls back to the text when the canvas never drew", async () => {
    vi.mocked(renderCard).mockRejectedValue(new Error("no 2d context"));
    const write = withImageClipboard();
    // A rejected image rejects the write with it; the text still has to land.
    (write as ReturnType<typeof vi.fn>).mockRejectedValue(new Error("no blob"));
    const result = await shareOnce();
    await waitFor(() => expect(result.current.status).toBe("copied"));
  });

  it("copies text through the clipboard when it cannot hold an image", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    stub("clipboard", { writeText });
    const result = await shareOnce();
    expect(writeText).toHaveBeenCalledWith("hello");
    expect(result.current.status).toBe("copied");
  });

  it("attaches the picture to the native sheet on a touch device", async () => {
    const share = vi.fn().mockResolvedValue(undefined);
    stub("share", share);
    stub("canShare", () => true);
    onTouchDevice();
    const result = await shareOnce();

    const sheet = share.mock.calls[0][0] as { files: File[]; text: string };
    expect(sheet.files[0].type).toBe("image/png");
    expect(sheet.text).toBe("hello");
    expect(result.current.status).toBe("idle");
  });

  it("shares the text alone when the sheet will not take a file", async () => {
    const share = vi.fn().mockResolvedValue(undefined);
    stub("share", share);
    stub("canShare", () => false);
    onTouchDevice();
    const result = await shareOnce();
    expect(share).toHaveBeenCalledWith({ text: "hello" });
    expect(result.current.status).toBe("idle");
  });

  it("treats a cancelled native share as a non-event", async () => {
    const abort = Object.assign(new Error("cancelled"), { name: "AbortError" });
    stub("share", vi.fn().mockRejectedValue(abort));
    onTouchDevice();
    const result = await shareOnce();
    expect(result.current.status).toBe("idle");
  });

  it("falls back to the clipboard when the native sheet fails outright", async () => {
    stub("share", vi.fn().mockRejectedValue(new Error("boom")));
    const writeText = vi.fn().mockResolvedValue(undefined);
    stub("clipboard", { writeText });
    onTouchDevice();
    const result = await shareOnce();
    await waitFor(() => expect(result.current.status).toBe("copied"));
  });

  it("keeps the desktop on the clipboard even when the native sheet exists", async () => {
    const share = vi.fn().mockResolvedValue(undefined);
    const write = withImageClipboard();
    stub("share", share);
    // A pointer that can hover: the OS sheet would be a step backwards here.
    vi.stubGlobal("matchMedia", () => ({ matches: false }));
    const result = await shareOnce();
    expect(share).not.toHaveBeenCalled();
    expect(write).toHaveBeenCalled();
    expect(result.current.status).toBe("copied");
  });
});
