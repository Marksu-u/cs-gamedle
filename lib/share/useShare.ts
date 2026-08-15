"use client";

// Getting the text to the player, on whatever the browser actually offers.
//
// Web Share is reserved for touch-primary devices. On a desktop it opens an OS
// share sheet, which is strictly worse than a clipboard copy when the target is
// a Discord tab in the next window.
//
// Every branch below resolves. `navigator.clipboard` is undefined on insecure
// origins and in jsdom, and `document.execCommand` may not exist at all, so a
// share that cannot happen must degrade to a label — never to an exception.

import { useCallback, useEffect, useRef, useState } from "react";

export type ShareStatus = "idle" | "copied" | "error";

// How long the button keeps saying "Copied!" before going back to "Share".
const RESET_MS = 2000;

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
    async (text: string) => {
      if (touchFirst()) {
        try {
          await navigator.share({ text });
          return; // the OS sheet is its own confirmation
        } catch (e) {
          // Cancelling is a choice, not a failure: say nothing about it.
          if ((e as Error)?.name === "AbortError") return;
          // Anything else, fall through and try to copy instead.
        }
      }
      flash((await copy(text)) ? "copied" : "error");
    },
    [flash],
  );

  return { status, share };
}
