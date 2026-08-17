import { act, fireEvent, render, screen } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { describe, expect, it } from "vitest";
import en from "@/messages/en.json";
import fr from "@/messages/fr.json";
import ShareButton from "./ShareButton";

function renderIn(locale: string, messages: object) {
  return render(
    <NextIntlClientProvider locale={locale} messages={messages}>
      <ShareButton text="hello" />
    </NextIntlClientProvider>,
  );
}

describe("ShareButton", () => {
  it.each([
    ["en", en, "Share"],
    ["fr", fr, "Partager"],
  ])("labels itself in %s", (locale, messages, label) => {
    const { unmount } = renderIn(locale as string, messages as object);
    expect(
      screen.getByRole("button", { name: label as string }),
    ).toBeInTheDocument();
    unmount();
  });

  it("never renders a raw translation key", () => {
    const { container, unmount } = renderIn("en", en);
    expect(container.textContent ?? "").not.toMatch(
      /\b(share|guessr|wordle|moreOrLessr|game|menu|score|nav|modes|site)\.[a-zA-Z]/,
    );
    unmount();
  });

  it("says so rather than throwing when nothing can copy", async () => {
    // jsdom is the insecure-origin case: no clipboard, no execCommand.
    const { unmount } = renderIn("en", en);
    await act(async () => {
      fireEvent.click(screen.getByRole("button"));
    });
    expect(
      screen.getByRole("button", { name: "Copy failed" }),
    ).toBeInTheDocument();
    unmount();
  });
});
