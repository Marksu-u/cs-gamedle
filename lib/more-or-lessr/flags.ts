// Pays (tel qu'écrit dans le JSON du pool) → emoji drapeau. Limité aux nations
// présentes dans more-or-lessr.json. Fallback 🌍 si absent.
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
};

export function nationToFlag(nation: string): string {
  return NATION_TO_FLAG[nation] ?? "🌍";
}
