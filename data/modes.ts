export type CsMode = {
  id: string;
  label: string;
  description: string;
  href: string;
  icon: "grid" | "guess" | "versus";
};

// Temporaire BDD / Call API
export const csModes: CsMode[] = [
  {
    id: "wordle",
    label: "Wordle",
    description:
      "Devine le pseudo du jour en 6 essais. Indices couleur à chaque tentative.",
    href: "/wordle",
    icon: "grid",
  },
  {
    id: "guessr",
    label: "Guessr",
    description:
      "Retrouve le joueur pro à partir d'indices : équipe, rôle, nationalité, âge.",
    href: "/guessr",
    icon: "guess",
  },
  {
    id: "more-or-lessr",
    label: "More or Lessr",
    description:
      "Deux pros, une stat cachée : clique sur le plus grand. Rating ou prize money, 10 rounds.",
    href: "/more-or-lessr",
    icon: "versus",
  },
];
