// The floor of the fallback chain: the datasets committed to the repo.
//
// This adapter exists for two reasons beyond development. It is what the app
// falls back to when no snapshot is reachable, and it is what keeps the site
// alive if Liquipedia access lapses — free access is granted on a limited-time
// basis, and a snapshot-only app would die with the key.

import guessrJson from "@/app/data/cs2/guessr_players.json";
import morelessJson from "@/app/data/cs2/more-or-lessr.json";
import wordleJson from "@/app/data/cs2/wordle.json";
import type { GuessrData } from "@/lib/guessr/types";
import type { MorelessData } from "@/lib/more-or-lessr/types";
import type { WordleData } from "@/lib/wordle/types";
import { canonicalise } from "../sort";
import type { SourceAdapter } from "../types";

export const manualAdapter: SourceAdapter = {
  name: "manual",
  async build(day) {
    const guessr = guessrJson as GuessrData;
    const moreless = morelessJson as MorelessData;
    const wordle = wordleJson as WordleData;
    return {
      day,
      generatedAt: new Date().toISOString(),
      source: "manual",
      guessr: { ...guessr, players: canonicalise(guessr.players) },
      moreless: { ...moreless, players: canonicalise(moreless.players) },
      wordle,
    };
  },
};
