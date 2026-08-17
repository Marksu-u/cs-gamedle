"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { msUntilNextRotation } from "@/lib/daily/clock";
import { streakMultiplier } from "@/lib/daily/scoring";
import { useDailyState, useHydrated } from "@/lib/daily/store";

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col items-center">
      <span className="cs2-display text-2xl font-extrabold text-[color:var(--accent)] italic">
        {value}
      </span>
      <span className="text-[0.65rem] tracking-[0.2em] text-[color:var(--muted)] uppercase">
        {label}
      </span>
    </div>
  );
}

// Countdown to the next rollover. Recomputed every second from the absolute
// clock, so no drift accumulates.
function useCountdown(): string {
  const [ms, setMs] = useState<number | null>(null);
  useEffect(() => {
    const tick = () => setMs(msUntilNextRotation());
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);
  if (ms === null) return "--:--:--";
  const s = Math.floor(ms / 1000);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(Math.floor(s / 3600))}:${pad(Math.floor((s % 3600) / 60))}:${pad(s % 60)}`;
}

export default function ScoreStrip() {
  const t = useTranslations("score");
  const { meta } = useDailyState();
  const hydrated = useHydrated();
  const countdown = useCountdown();

  // Until hydration has happened we show a dash: better a blank than a wrong zero
  // that flickers into the real value.
  const v = (n: number) => (hydrated ? String(n) : t("pending"));
  const mult = streakMultiplier(meta.streak);

  return (
    <div className="mb-6 grid grid-cols-2 gap-4 rounded-xl border border-[color:var(--border)] bg-[var(--surface)] p-4 sm:grid-cols-4">
      <Stat
        label={t("streak")}
        value={
          hydrated
            ? `${meta.streak}${mult > 1 ? ` ×${mult}` : ""}`
            : t("pending")
        }
      />
      <Stat label={t("score")} value={v(meta.runScore)} />
      <Stat label={t("record")} value={v(meta.recordScore)} />
      <Stat label={t("nextPuzzle")} value={countdown} />
    </div>
  );
}
