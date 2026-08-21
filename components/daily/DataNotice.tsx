import { getFormatter, getTranslations } from "next-intl/server";

// The freshness disclaimer. Until the Liquipedia sync exists, every figure in the
// three games is hand-maintained, so a player comparing a card against a live
// stats site will find drift — a transfer, a prize pot, a birthday. Saying when
// the pool was last checked turns "this site is wrong" into "this site is a
// snapshot", which is the honest claim and the one the terms already make.
//
// The date comes from the snapshot rather than a constant: once the sync lands,
// the same line keeps working and starts telling the truth on its own.
export default async function DataNotice({ date }: { date: string }) {
  const t = await getTranslations("data");
  const format = await getFormatter();

  // Parsed as UTC noon so the rendered day cannot slip backwards for a player
  // west of Greenwich — a "31 July" stamp reading "30 July" in Los Angeles is a
  // small thing that makes the notice look broken.
  const parsed = new Date(`${date}T12:00:00Z`);

  return (
    <p className="mt-3 max-w-md text-center text-[0.7rem] text-[color:var(--muted)]">
      {t("freshness", {
        date: format.dateTime(parsed, {
          year: "numeric",
          month: "long",
          day: "numeric",
        }),
      })}
    </p>
  );
}
