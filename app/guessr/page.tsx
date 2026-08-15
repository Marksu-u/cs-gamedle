import Link from "next/link";
import guessrData from "@/app/data/cs2/guessr_players.json";
import GuessrGame from "./GuessrGame";
import type { GuessrData } from "@/lib/guessr/types";
import type { Metadata } from "next";
import { pageMetadata } from "@/lib/seo";
export const metadata: Metadata = pageMetadata("/guessr");

export default function CsGuessrPage() {
  return (
    <main className="flex min-h-dvh flex-col items-center px-4 py-10">
      <header className="mb-6 text-center">
        <p className="mb-2 text-xs tracking-[0.25em] text-[color:var(--accent)] uppercase">
          Counter-Strike 2 · Guessr
        </p>
        <h1 className="cs2-display text-foreground text-4xl font-extrabold uppercase italic">
          Devine le joueur
        </h1>
        <p className="mt-2 max-w-md text-sm text-[color:var(--muted)]">
          Un joueur pro par jour. Essais illimités, indices à chaque
          proposition.
        </p>
      </header>

      <GuessrGame data={guessrData as GuessrData} />

      <Link
        href="/"
        className="mt-8 inline-flex items-center gap-1.5 text-xs font-semibold tracking-widest text-[color:var(--accent-hot)] uppercase"
      >
        ← Retour au hub
      </Link>
    </main>
  );
}
