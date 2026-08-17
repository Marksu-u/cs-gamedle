import { act, renderHook, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { useShare } from "./useShare";

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

afterEach(() => {
  Reflect.deleteProperty(navigator, "share");
  if (clipboardDescriptor) {
    Object.defineProperty(navigator, "clipboard", clipboardDescriptor);
  } else {
    Reflect.deleteProperty(navigator, "clipboard");
  }
  vi.unstubAllGlobals();
});

async function shareOnce(text = "hello") {
  const { result } = renderHook(() => useShare());
  await act(async () => {
    await result.current.share(text);
  });
  return result;
}

describe("useShare", () => {
  it("reports failure instead of throwing when nothing can copy", async () => {
    const result = await shareOnce();
    expect(result.current.status).toBe("error");
  });

  it("copies through the clipboard when it is available", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    stub("clipboard", { writeText });
    const result = await shareOnce();
    expect(writeText).toHaveBeenCalledWith("hello");
    expect(result.current.status).toBe("copied");
  });

  it("uses the native sheet on a touch device and stays quiet", async () => {
    const share = vi.fn().mockResolvedValue(undefined);
    stub("share", share);
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
    const writeText = vi.fn().mockResolvedValue(undefined);
    stub("share", share);
    stub("clipboard", { writeText });
    // A pointer that can hover: the OS sheet would be a step backwards here.
    vi.stubGlobal("matchMedia", () => ({ matches: false }));
    const result = await shareOnce();
    expect(share).not.toHaveBeenCalled();
    expect(result.current.status).toBe("copied");
  });
});
