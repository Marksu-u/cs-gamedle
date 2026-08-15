"use client";

import Link from "next/link";
import { useEffect } from "react";

// Filet de sécurité pour toute exception non rattrapée du rendu client. Sans ce
// fichier, Next affiche son écran d'erreur générique — anglais, sans issue, et
// sans le thème du site.
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Pas de service de reporting branché : au moins la console garde la trace.
    console.error(error);
  }, [error]);

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center px-6 text-center">
      <p className="mb-2 text-xs tracking-[0.25em] text-[color:var(--accent-hot)] uppercase">
        Erreur inattendue
      </p>
      <h1 className="cs2-display text-foreground text-4xl font-extrabold uppercase italic">
        Ça a cassé
      </h1>
      <p className="mt-3 max-w-[46ch] text-sm text-[color:var(--muted)]">
        La partie du jour est enregistrée localement : elle devrait être
        toujours là après un nouvel essai.
      </p>
      <div className="mt-7 flex gap-3">
        <button
          type="button"
          onClick={reset}
          className="rounded-md bg-[var(--accent)] px-5 py-2 text-xs font-semibold tracking-widest text-black uppercase transition hover:bg-[var(--accent-hot)]"
        >
          Réessayer
        </button>
        <Link
          href="/"
          className="rounded-md border border-[color:var(--border)] px-5 py-2 text-xs font-semibold tracking-widest uppercase transition hover:border-[color:var(--accent)]"
        >
          Retour au hub
        </Link>
      </div>
    </main>
  );
}
