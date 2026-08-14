import Link from "next/link";
import morelessData from "@/app/data/cs2/more-or-lessr.json";
import MorelessGame from "./MorelessGame";
import type { MorelessData } from "@/lib/more-or-lessr/types";

export default function CsMoreOrLessrPage() {
  return (
    <main className="flex min-h-dvh flex-col items-center px-4 py-10">
      <header className="mb-6 text-center">
        <p className="mb-2 text-xs tracking-[0.25em] text-[color:var(--accent)] uppercase">
          Counter-Strike 2 · More or Lessr
        </p>
        <h1 className="cs2-display text-foreground text-4xl font-extrabold uppercase italic">
          Plus ou moins ?
        </h1>
      </header>

      <MorelessGame data={morelessData as MorelessData} />

      <Link
        href="/"
        className="mt-8 inline-flex items-center gap-1.5 text-xs font-semibold tracking-widest text-[color:var(--accent-hot)] uppercase"
      >
        ← Retour au hub
      </Link>
    </main>
  );
}
