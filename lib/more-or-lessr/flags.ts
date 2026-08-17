// Country (as written in the pool JSON) → flag emoji. Falls back to 🌍 when
// missing — but `guessr_players.test.ts` rejects that fallback, so any nation
// added to a pool must appear here first.
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
