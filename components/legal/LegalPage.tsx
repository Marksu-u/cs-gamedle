import type { ReactNode } from "react";
import { getFormatter, getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import LanguageSwitcher from "@/components/daily/LanguageSwitcher";
import { LAST_UPDATED } from "@/lib/legal";

// Shell shared by the four legal pages. They differ only in their sections, so
// the chrome — heading, last-updated line, back link — lives here once, and the
// pages pass nothing but their title.

type Props = {
  title: string;
  children: ReactNode;
};

export default async function LegalPage({ title, children }: Props) {
  const t = await getTranslations("legalPages");
  const format = await getFormatter();
  // Month and year, formatted in the reader's language: "August 2026" reads as
  // a date, "2026-08-17" reads as a database field.
  const updated = t("updated", {
    date: format.dateTime(LAST_UPDATED, { year: "numeric", month: "long" }),
  });
  const back = t("back");

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-col px-6 py-10">
      <div className="mb-6 flex justify-end">
        <LanguageSwitcher />
      </div>

      <h1 className="cs2-display text-foreground text-3xl font-extrabold uppercase italic">
        {title}
      </h1>
      <p className="mt-2 text-xs tracking-[0.2em] text-[color:var(--muted)] uppercase">
        {updated}
      </p>

      <div className="mt-8 flex flex-col gap-7">{children}</div>

      <Link
        href="/"
        className="mt-10 inline-flex items-center gap-1.5 text-xs font-semibold tracking-widest text-[color:var(--accent-hot)] uppercase"
      >
        {back}
      </Link>
    </main>
  );
}

// One numbered-free section: a heading and its paragraphs. `children` rather than
// a string so a section can carry a list or a definition block where it needs to.
export function Section({
  heading,
  children,
}: {
  heading: string;
  children: ReactNode;
}) {
  return (
    <section>
      <h2 className="cs2-display text-foreground mb-2 text-lg font-extrabold uppercase italic">
        {heading}
      </h2>
      <div className="flex flex-col gap-2 text-sm leading-relaxed text-[color:var(--muted)]">
        {children}
      </div>
    </section>
  );
}
