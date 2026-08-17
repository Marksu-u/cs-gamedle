import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";

export default function NotFound() {
  const t = useTranslations("errors.notFound");
  const nav = useTranslations("nav");
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center px-6 text-center">
      <p className="mb-2 text-xs tracking-[0.25em] text-[color:var(--accent)] uppercase">
        {t("eyebrow")}
      </p>
      <h1 className="cs2-display text-foreground text-4xl font-extrabold uppercase italic">
        {t("title")}
      </h1>
      <p className="mt-3 max-w-[42ch] text-sm text-[color:var(--muted)]">
        {t("body")}
      </p>
      <Link
        href="/"
        className="mt-7 inline-flex items-center gap-1.5 rounded-md bg-[var(--accent)] px-5 py-2 text-xs font-semibold tracking-widest text-black uppercase transition hover:bg-[var(--accent-hot)]"
      >
        {nav("backToHub")}
      </Link>
    </main>
  );
}
