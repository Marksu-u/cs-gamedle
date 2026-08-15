import { Link } from "@/i18n/navigation";
import guessrData from "@/app/data/cs2/guessr_players.json";
import GuessrGame from "./GuessrGame";
import type { GuessrData } from "@/lib/guessr/types";
import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { buildMetadata } from "@/lib/seo";
import LanguageSwitcher from "@/components/daily/LanguageSwitcher";
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return buildMetadata("/guessr", locale);
}

export default async function CsGuessrPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  // Required for static rendering: without it this page opts into
  // dynamic rendering as soon as it reads a translation.
  setRequestLocale(locale);
  const t = await getTranslations("guessr");
  const nav = await getTranslations("nav");

  return (
    <main className="flex min-h-dvh flex-col items-center px-4 py-10">
      {/* The switcher is repeated on every page: a player deep in a game must be
          able to change language without going back to the hub first. */}
      <div className="mb-4 flex w-full max-w-lg justify-end">
        <LanguageSwitcher />
      </div>
      <header className="mb-6 text-center">
        <p className="mb-2 text-xs tracking-[0.25em] text-[color:var(--accent)] uppercase">
          {t("eyebrow")}
        </p>
        <h1 className="cs2-display text-foreground text-4xl font-extrabold uppercase italic">
          {t("title")}
        </h1>
        <p className="mt-2 max-w-md text-sm text-[color:var(--muted)]">
          {t("subtitle")}
        </p>
      </header>

      <GuessrGame data={guessrData as GuessrData} />

      <Link
        href="/"
        className="mt-8 inline-flex items-center gap-1.5 text-xs font-semibold tracking-widest text-[color:var(--accent-hot)] uppercase"
      >
        {nav("backToHub")}
      </Link>
    </main>
  );
}
