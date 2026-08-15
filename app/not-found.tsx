import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center px-6 text-center">
      <p className="mb-2 text-xs tracking-[0.25em] text-[color:var(--accent)] uppercase">
        Erreur 404
      </p>
      <h1 className="cs2-display text-foreground text-4xl font-extrabold uppercase italic">
        Page introuvable
      </h1>
      <p className="mt-3 max-w-[42ch] text-sm text-[color:var(--muted)]">
        Cette page n&apos;existe pas. Les grilles du jour, elles, sont bien là.
      </p>
      <Link
        href="/"
        className="mt-7 inline-flex items-center gap-1.5 rounded-md bg-[var(--accent)] px-5 py-2 text-xs font-semibold tracking-widest text-black uppercase transition hover:bg-[var(--accent-hot)]"
      >
        Retour au hub
      </Link>
    </main>
  );
}
