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
  return buildMetadata("/terms", locale);
}

export default async function TermsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("legalPages");

  return (
    <LegalPage title={t("terms.title")}>
      <Section heading={t("terms.purpose.heading")}>
        <p>{t("terms.purpose.body")}</p>
      </Section>

      <Section heading={t("terms.access.heading")}>
        <p>{t("terms.access.body")}</p>
      </Section>

      <Section heading={t("terms.progress.heading")}>
        <p>{t("terms.progress.body")}</p>
      </Section>

      <Section heading={t("terms.conduct.heading")}>
        <p>{t("terms.conduct.body")}</p>
      </Section>

      <Section heading={t("terms.liability.heading")}>
        <p>{t("terms.liability.body")}</p>
      </Section>

      <Section heading={t("terms.law.heading")}>
        <p>{t("terms.law.body")}</p>
      </Section>
    </LegalPage>
  );
}
