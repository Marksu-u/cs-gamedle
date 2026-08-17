import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import LegalPage, { Section } from "@/components/legal/LegalPage";
import { buildMetadata } from "@/lib/seo";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return buildMetadata("/cookies", locale);
}

export default async function CookiesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("legalPages");

  return (
    <LegalPage title={t("cookies.title")}>
      <Section heading={t("cookies.what.heading")}>
        <p>{t("cookies.what.body")}</p>
      </Section>

      <Section heading={t("cookies.necessary.heading")}>
        <p>{t("cookies.necessary.intro")}</p>
        <ul className="list-disc space-y-1.5 pl-5">
          <li>{t("cookies.necessary.locale")}</li>
          <li>{t("cookies.necessary.progress")}</li>
        </ul>
      </Section>

      <Section heading={t("cookies.none.heading")}>
        <p>{t("cookies.none.body")}</p>
        <p>{t("cookies.none.future")}</p>
      </Section>

      <Section heading={t("cookies.remove.heading")}>
        <p>{t("cookies.remove.body")}</p>
      </Section>
    </LegalPage>
  );
}
