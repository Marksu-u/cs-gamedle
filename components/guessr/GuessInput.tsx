"use client";

import { useMemo, useState } from "react";
import { norm } from "@/lib/guessr/compare";
import type { Player } from "@/lib/guessr/types";

type Props = {
  players: Player[];
  guessedNames: string[]; // déjà proposés → exclus des suggestions
  disabled?: boolean;
  onGuess: (name: string) => void;
};

export default function GuessInput({
  players,
  guessedNames,
  disabled,
  onGuess,
}: Props) {
  const [query, setQuery] = useState("");
  const guessed = useMemo(
    () => new Set(guessedNames.map(norm)),
    [guessedNames],
  );

  // Suggestions : noms du pool contenant la saisie, non encore proposés, max 6.
  const suggestions = useMemo(() => {
    const q = norm(query);
    if (!q) return [];
    return players
      .filter((p) => !guessed.has(norm(p.name)) && norm(p.name).includes(q))
      .slice(0, 6);
  }, [query, players, guessed]);

  function submit(name: string) {
    onGuess(name);
    setQuery("");
  }

  return (
    <div className="relative w-full max-w-md">
      <input
        value={query}
        disabled={disabled}
        onChange={(e) => setQuery(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && suggestions[0]) submit(suggestions[0].name);
        }}
        placeholder="Tape le pseudo d'un joueur…"
        className="w-full rounded-lg border border-white/15 bg-white/5 px-4 py-3 text-sm text-foreground placeholder:text-[color:var(--muted)] focus:border-[color:var(--accent)] focus:outline-none"
      />
      {suggestions.length > 0 && (
        <ul className="absolute z-10 mt-1 w-full overflow-hidden rounded-lg border border-white/15 bg-[#15181d]">
          {suggestions.map((p) => (
            <li key={p.name}>
              <button
                type="button"
                onClick={() => submit(p.name)}
                className="flex w-full items-center px-4 py-2 text-left text-sm hover:bg-white/10"
              >
                {p.name}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
