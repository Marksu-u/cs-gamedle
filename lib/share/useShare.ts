"use client";

// Getting the result to the player, on whatever the browser actually offers.
//
// A share carries TWO payloads for one click: the picture and the text block
// that has always been there. They go onto the clipboard together, as two types
// of a single item, and the destination picks — Discord and X take the image, a
// plain text field takes the squares. Nothing is lost by preferring the image,
// which matters because an image is not clickable and the link in the text is
// how anyone new finds the game.
//
// Web Share is reserved for touch-primary devices. On a desktop it opens an OS
// share sheet, which is strictly worse than a clipboard copy when the target is
// a Discord tab in the next window.
//
// Every branch below resolves. `navigator.clipboard` is undefined on insecure
// origins and in jsdom, `ClipboardItem` is absent in older browsers, and a
// canvas may not draw at all, so a share that cannot happen must degrade — from
// image, to text, to a label. Never to an exception.

import { useCallback, useEffect, useRef, useState } from "react";
import type { ShareCard } from "@/lib/share/card";
import { renderCard } from "@/lib/share/image";

export type ShareStatus = "idle" | "copied" | "error";

export type SharePayload = {
  text: string;
  card: ShareCard;
};

// How long the button keeps saying "Copied!" before going back to "Share".
const RESET_MS = 2000;

const FILE_NAME = "result.png";

function touchFirst(): boolean {
  if (typeof navigator === "undefined") return false;
  if (typeof navigator.share !== "function") return false;
  if (
    typeof window === "undefined" ||
    typeof window.matchMedia !== "function"
  ) {
    return false;
  }
  return window.matchMedia("(hover: none)").matches;
}

async function copy(text: string): Promise<boolean> {
  try {
    if (typeof navigator.clipboard?.writeText === "function") {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    // Permission denied, or an insecure origin: try the old route instead.
  }
  try {
    const zone = document.createElement("textarea");
    zone.value = text;
    zone.setAttribute("readonly", "");
    zone.style.position = "fixed";
    zone.style.top = "-1000px";
    document.body.appendChild(zone);
    zone.select();
    const ok = document.execCommand("copy");
    document.body.removeChild(zone);
    return ok;
  } catch {
    return false;
  }
}

// The PNG is handed over as a PROMISE rather than a resolved blob. Safari only
// honours a clipboard write that was started inside the click, and awaiting the
// canvas first spends that permission; `ClipboardItem` taking a pending value is
// the documented way around it.
async function copyImage(png: Promise<Blob>, text: string): Promise<boolean> {
  if (typeof ClipboardItem === "undefined") return false;
  if (typeof navigator.clipboard?.write !== "function") return false;
  try {
    await navigator.clipboard.write([
      new ClipboardItem({
        "image/png": png,
        "text/plain": new Blob([text], { type: "text/plain" }),
      }),
    ]);
    return true;
  } catch {
    // A browser that refuses multi-type items, or a canvas that never drew.
    return false;
  }
}

async function asFile(png: Promise<Blob>): Promise<File | null> {
  try {
    return new File([await png], FILE_NAME, { type: "image/png" });
  } catch {
    return null;
  }
}

export function useShare() {
  const [status, setStatus] = useState<ShareStatus>("idle");
  const timer = useRef<number | null>(null);

  useEffect(
    () => () => {
      if (timer.current !== null) window.clearTimeout(timer.current);
    },
    [],
  );

  const flash = useCallback((next: ShareStatus) => {
    setStatus(next);
    if (timer.current !== null) window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setStatus("idle"), RESET_MS);
  }, []);

  const share = useCallback(
    async ({ text, card }: SharePayload) => {
      const png = renderCard(card);
      // Claimed here so that a failed render is a fallback rather than an
      // unhandled rejection on the paths that never await it.
      png.catch(() => {});

      if (touchFirst()) {
        try {
          const file = await asFile(png);
          const sheet =
            file &&
            typeof navigator.canShare === "function" &&
            navigator.canShare({ files: [file] })
              ? { files: [file], text }
              : { text };
          await navigator.share(sheet);
          return; // the OS sheet is its own confirmation
        } catch (e) {
          // Cancelling is a choice, not a failure: say nothing about it.
          if ((e as Error)?.name === "AbortError") return;
          // Anything else, fall through and try to copy instead.
        }
      }

      if (await copyImage(png, text)) {
        flash("copied");
        return;
      }
      flash((await copy(text)) ? "copied" : "error");
    },
    [flash],
  );

  return { status, share };
}
