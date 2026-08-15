import { describe, expect, it } from "vitest";
import data from "./guessr_players.json";
import { nationToFlag } from "@/lib/more-or-lessr/flags";
import type { GuessrData } from "@/lib/guessr/types";

const pool = data as GuessrData;

describe("guessr_players.json", () => {
  it("assez de joueurs pour que la grille du jour ne tourne pas en rond", () => {
    // Le pool EST le cycle : `lib/daily/deck.ts` sort chaque joueur une fois par
    // cycle, donc 28 joueurs = la réponse revient au bout de 28 jours. Un seuil
    // de 90 tient un trimestre.
    expect(pool.players.length).toBeGreaterThanOrEqual(90);
  });
  it("chaque joueur a tous les champs requis et bien typés", () => {
    for (const p of pool.players) {
      expect(typeof p.name).toBe("string");
      expect(typeof p.nationality).toBe("string");
      expect(typeof p.current_team).toBe("string");
      expect(Array.isArray(p.previous_teams)).toBe(true);
      expect(Array.isArray(p.role)).toBe(true);
      expect(p.role.length).toBeGreaterThan(0);
      expect(typeof p.age).toBe("number");
      expect(typeof p.majors).toBe("number");
      expect(typeof p.tournaments_won).toBe("number");
      expect(Array.isArray(p.achievements)).toBe(true);
    }
  });
  it("noms uniques", () => {
    const names = pool.players.map((p) => p.name.toLowerCase());
    expect(new Set(names).size).toBe(names.length);
  });

  it("valeurs numériques plausibles", () => {
    const aberrants = pool.players
      .filter(
        (p) =>
          p.age < 15 ||
          p.age > 45 ||
          p.majors < 0 ||
          p.majors > 4 ||
          p.tournaments_won < 0 ||
          p.tournaments_won > 40 ||
          !Number.isInteger(p.age) ||
          !Number.isInteger(p.majors),
      )
      .map(
        (p) =>
          `${p.name} (âge ${p.age}, ${p.majors} majors, ${p.tournaments_won} tournois)`,
      );
    expect(aberrants).toEqual([]);
  });

  it("le nombre de majors est cohérent avec les achievements", () => {
    // Un joueur annoncé « 2x Major Winner » mais avec majors: 1 rend la colonne
    // chiffrée fausse alors que le texte de victoire, lui, dit vrai.
    const incoherents = pool.players
      .filter((p) => {
        const texte = p.achievements.join(" ");
        const mentionne = /(\d)x Major Winner/.exec(texte);
        const annonces = mentionne
          ? Number(mentionne[1])
          : /Major Winner/.test(texte)
            ? 1
            : 0;
        return annonces !== p.majors;
      })
      .map(
        (p) =>
          `${p.name} : majors=${p.majors}, achievements=${JSON.stringify(p.achievements)}`,
      );
    expect(incoherents).toEqual([]);
  });

  it("les rôles viennent d'un vocabulaire fermé", () => {
    // La colonne rôle se compare par intersection : « AWPer » et « AWP » ne se
    // croiseraient jamais, et le joueur verrait un faux négatif.
    const CONNUS = ["AWP", "Rifler", "Entry", "Lurker", "Support", "IGL"];
    const inconnus = pool.players.flatMap((p) =>
      p.role
        .filter((r) => !CONNUS.includes(r))
        .map((r) => `${p.name} : « ${r} »`),
    );
    expect(inconnus).toEqual([]);
  });

  it("une même équipe s'écrit toujours pareil", () => {
    // La colonne équipe se compare en TEXTE EXACT. « Team Spirit » et « Spirit »
    // sont alors deux équipes distinctes : le joueur qui trouve le bon club voit
    // rouge. On refuse donc deux graphies qui ne diffèrent que par un préfixe
    // « Team » ou par la casse.
    const toutes = new Set<string>();
    for (const p of pool.players) {
      toutes.add(p.current_team);
      for (const t of p.previous_teams) toutes.add(t);
    }
    const canonique = (t: string) =>
      t
        .toLowerCase()
        .replace(/^team\s+/, "")
        .replace(/\s+/g, "");

    const groupes = new Map<string, string[]>();
    for (const t of toutes) {
      const k = canonique(t);
      groupes.set(k, [...(groupes.get(k) ?? []), t]);
    }
    const collisions = [...groupes.values()]
      .filter((v) => v.length > 1)
      .map((v) => v.join(" / "));
    expect(collisions).toEqual([]);
  });

  it("aucun joueur ne se liste lui-même dans ses anciennes équipes", () => {
    const bizarres = pool.players
      .filter((p) => p.previous_teams.includes(p.current_team))
      .map((p) => `${p.name} : ${p.current_team}`);
    expect(bizarres).toEqual([]);
  });

  it("pas de champ texte vide", () => {
    const vides = pool.players
      .filter(
        (p) =>
          !p.name.trim() ||
          !p.nationality.trim() ||
          !p.current_team.trim() ||
          p.achievements.some((a) => !a.trim()),
      )
      .map((p) => p.name);
    expect(vides).toEqual([]);
  });
  it("chaque nationalité a un drapeau connu (pas de fallback 🌍)", () => {
    // On nomme les coupables : le message par défaut (« expected 🌍 not to be
    // 🌍 ») oblige sinon à chercher à la main dans 116 joueurs.
    const sansDrapeau = pool.players
      .filter((p) => nationToFlag(p.nationality) === "🌍")
      .map((p) => `${p.name} (${p.nationality})`);
    expect(sansDrapeau).toEqual([]);
  });
});
