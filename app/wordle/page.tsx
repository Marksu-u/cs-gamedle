import Link from "next/link";
import WordleGame from "./WordleGame";
import wordleData from "@/app/data/cs2/wordle.json";
import type { WordleData } from "@/lib/wordle/types";

export default function CsWordlePage() {
  return (
    <main className="flex min-h-dvh flex-col items-center px-4 py-10">
      <header className="mb-6 text-center">
        <p className="mb-2 text-xs tracking-[0.25em] text-[color:var(--accent)] uppercase">
          Counter-Strike 2 · Wordle
        </p>
        <h1 className="cs2-display text-foreground text-4xl font-extrabold uppercase italic">
          Devine le pseudo
        </h1>
      </header>

      <WordleGame data={wordleData as WordleData} />

      <Link
        href="/"
        className="mt-8 inline-flex items-center gap-1.5 text-xs font-semibold tracking-widest text-[color:var(--accent-hot)] uppercase"
      >
        ← Retour au hub
      </Link>
    </main>
  );
}
