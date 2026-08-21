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
      // The OLDEST of the three files, not the newest. The notice speaks for the
      // whole app, so refreshing one dataset must not let it claim a freshness
      // the other two have not earned.
      dataDate: [guessr.updated, moreless.updated, wordle.updated]
        .slice()
        .sort()[0],
      source: "manual",
      guessr: { ...guessr, players: canonicalise(guessr.players) },
      moreless: { ...moreless, players: canonicalise(moreless.players) },
      wordle,
    };
  },
};
