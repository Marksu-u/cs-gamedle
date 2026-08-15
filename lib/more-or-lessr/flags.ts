// Pays (tel qu'écrit dans le JSON des pools) → emoji drapeau. Fallback 🌍 si
// absent — mais `guessr_players.test.ts` refuse ce fallback, donc toute nation
// ajoutée à un pool doit d'abord apparaître ici.
const NATION_TO_FLAG: Record<string, string> = {
  France: "🇫🇷",
  Ukraine: "🇺🇦",
  "Bosnia and Herzegovina": "🇧🇦",
  Russia: "🇷🇺",
  Denmark: "🇩🇰",
  Estonia: "🇪🇪",
  Israel: "🇮🇱",
  UK: "🇬🇧",
  "United Kingdom": "🇬🇧",
  Canada: "🇨🇦",
  Latvia: "🇱🇻",
  Slovakia: "🇸🇰",
  Sweden: "🇸🇪",
  Brazil: "🇧🇷",
  Norway: "🇳🇴",
  Australia: "🇦🇺",
  Poland: "🇵🇱",
  "United States": "🇺🇸",
  Germany: "🇩🇪",
  Turkey: "🇹🇷",
  Finland: "🇫🇮",
  Lithuania: "🇱🇹",
  Romania: "🇷🇴",
  Serbia: "🇷🇸",
  Belgium: "🇧🇪",
  Czechia: "🇨🇿",
  Montenegro: "🇲🇪",
  Kazakhstan: "🇰🇿",
  China: "🇨🇳",
  Hungary: "🇭🇺",
  "South Africa": "🇿🇦",
  Netherlands: "🇳🇱",
  Bulgaria: "🇧🇬",
  Spain: "🇪🇸",
  Portugal: "🇵🇹",
  Mongolia: "🇲🇳",
  Malaysia: "🇲🇾",
  Indonesia: "🇮🇩",
};

export function nationToFlag(nation: string): string {
  return NATION_TO_FLAG[nation] ?? "🌍";
}
