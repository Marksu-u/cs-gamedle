import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import LegalPage, { Section } from "@/components/legal/LegalPage";
import { CONTACT_EMAIL, DATA_SOURCE, HOST, PLAYER_COUNT } from "@/lib/legal";
import { buildMetadata } from "@/lib/seo";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return buildMetadata("/privacy", locale);
}

export default async function PrivacyPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("legalPages");

  return (
    <LegalPage title={t("privacy.title")}>
      <Section heading={t("privacy.summary.heading")}>
        <p>{t("privacy.summary.body")}</p>
        <p>{t("privacy.summary.fonts")}</p>
      </Section>

      <Section heading={t("privacy.device.heading")}>
        <p>{t("privacy.device.intro")}</p>
        <ul className="list-disc space-y-1.5 pl-5">
          <li>{t("privacy.device.progress")}</li>
          <li>{t("privacy.device.locale")}</li>
        </ul>
        <p>{t("privacy.device.erase")}</p>
      </Section>

      <Section heading={t("privacy.host.heading")}>
        <p>{t("privacy.host.body", { host: HOST.name })}</p>
      </Section>

      {/* The section with no equivalent elsewhere: the site ships data about
          real people who never interacted with it. */}
      <Section heading={t("privacy.players.heading")}>
        <p>{t("privacy.players.intro", { count: PLAYER_COUNT })}</p>
        <p>{t("privacy.players.fields")}</p>
        <p>{t("privacy.players.basis", { source: DATA_SOURCE })}</p>
        <p>{t("privacy.players.rights", { email: CONTACT_EMAIL })}</p>
      </Section>

      <Section heading={t("privacy.rights.heading")}>
        <p>{t("privacy.rights.body")}</p>
        <p>{t("privacy.rights.cnil", { email: CONTACT_EMAIL })}</p>
      </Section>

      <Section heading={t("privacy.changes.heading")}>
        <p>{t("privacy.changes.body")}</p>
      </Section>
    </LegalPage>
  );
}
