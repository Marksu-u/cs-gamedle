import { render, screen } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { describe, expect, it } from "vitest";
import en from "@/messages/en.json";
import fr from "@/messages/fr.json";
import { LEGAL_PATHS } from "@/lib/seo";
import Footer from "./Footer";

function renderIn(locale: string, messages: object) {
  return render(
    <NextIntlClientProvider locale={locale} messages={messages}>
      <Footer />
    </NextIntlClientProvider>,
  );
}

describe("Footer", () => {
  it.each([
    ["en", en, "Legal notice"],
    ["fr", fr, "Mentions légales"],
  ])("labels the legal notice in %s", (locale, messages, label) => {
    const { unmount } = renderIn(locale as string, messages as object);
    expect(screen.getByText(label as string)).toBeInTheDocument();
    unmount();
  });

  // LCEN requires the notice to be reachable from every page, so losing a link
  // here is a compliance bug, not a cosmetic one.
  it.each([
    ["en", en],
    ["fr", fr],
  ])("links every legal page (%s)", (locale, messages) => {
    const { container, unmount } = renderIn(
      locale as string,
      messages as object,
    );
    const hrefs = [...container.querySelectorAll("a")].map((a) =>
      a.getAttribute("href"),
    );
    for (const path of LEGAL_PATHS) {
      const expected = locale === "fr" ? `/fr${path}` : path;
      expect(hrefs).toContain(expected);
    }
    unmount();
  });

  it("names Valve so the fan-project disclaimer is on every page", () => {
    const { container, unmount } = renderIn("en", en);
    expect(container.textContent).toContain("Valve Corporation");
    unmount();
  });

  it.each([
    ["en", en],
    ["fr", fr],
  ])("never renders a raw translation key (%s)", (locale, messages) => {
    const { container, unmount } = renderIn(
      locale as string,
      messages as object,
    );
    expect(container.textContent ?? "").not.toMatch(
      /\b(footer|legalPages|share|guessr|wordle|moreOrLessr|game|menu|score|nav|modes|site|seo)\.[a-zA-Z]/,
    );
    unmount();
  });
});
