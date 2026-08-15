# cs2-gamedle

Trois mini-jeux sur la scène **Counter-Strike 2**. Même donnée, trois façons d'y jouer.
Gratuit, sans compte, sans base de données.

| Mode              | Route            | Principe                                                                       |
| ----------------- | ---------------- | ------------------------------------------------------------------------------ |
| **Wordle**        | `/wordle`        | Devine un pseudo en 6 essais, indices couleur. Longueurs 3 à 8 lettres.        |
| **Guessr**        | `/guessr`        | Retrouve un pro via ses attributs : équipe, rôle, nationalité, âge…            |
| **More or Lessr** | `/more-or-lessr` | Deux pros, une stat cachée : plus ou moins ? 10 rounds, rating ou prize money. |

La page d'accueil (`/`) est le sélecteur de mode. Elle affiche aussi la série en cours, le
score courant, le record et le compte à rebours vers la prochaine rotation.

**Neuf grilles par jour**, les mêmes pour tout le monde, renouvelées à **03:00 UTC** : une
par longueur de Wordle (6), une pour Guessr, une par catégorie de More or Lessr (2). Chaque
grille terminée rapporte des points selon la performance ; jouer au moins une grille dans la
journée entretient la série, qui multiplie le score. Manquer un jour remet la série et le
score courant à zéro — le record, lui, est conservé.

## Prérequis

- **Node.js 24** — version épinglée dans [`.nvmrc`](.nvmrc). Avec `nvm` : `nvm use`.
- **npm** (livré avec Node).

## Démarrage

```bash
npm install      # installe les dépendances
npm run dev      # serveur de dev → http://localhost:3000
```

La page se recharge automatiquement à chaque modification.

## Configuration

| Variable               | Rôle                                                                                         |
| ---------------------- | -------------------------------------------------------------------------------------------- |
| `NEXT_PUBLIC_SITE_URL` | URL publique, sans slash final. Alimente les balises Open Graph, le sitemap et `robots.txt`. |

Copier [`.env.example`](.env.example) en `.env.local` et renseigner la valeur.
**Sans elle, les aperçus de partage pointent vers `localhost` et restent vides.**

## Langues

Le site est en **anglais par défaut** et disponible en **français**.

| Langue   | URL                 |
| -------- | ------------------- |
| Anglais  | `/`, `/wordle`      |
| Français | `/fr`, `/fr/wordle` |

L'anglais n'est pas préfixé : ses URL restent les URL canoniques. Un visiteur dont
le navigateur est en français est redirigé vers `/fr` à la première visite, et son
choix est ensuite mémorisé dans un cookie. Les balises `hreflang` déclarent les
deux versions à Google, `x-default` pointant sur l'anglais.

**Ajouter une langue** demande trois choses, et rien d'autre :

1. le code dans `locales` (`i18n/routing.ts`) ;
2. un fichier `messages/<code>.json` ;
3. une entrée dans `LOCALE_LABELS` et `LOCALE_TAGS`.

`messages/messages.test.ts` refuse ensuite tout catalogue auquel il manque une clé,
qui en a une en trop, qui contient une valeur vide, ou dont les variables
d'interpolation ne correspondent pas à la référence anglaise. Le sitemap, les
métadonnées et le sélecteur de langue se mettent à jour tout seuls.

Les textes d'interface vivent **uniquement** dans `messages/` — jamais en dur dans un
composant.

## Scripts

| Commande               | Rôle                                               |
| ---------------------- | -------------------------------------------------- |
| `npm run dev`          | Serveur de développement (Turbopack)               |
| `npm run build`        | Build de production                                |
| `npm start`            | Sert le build de production                        |
| `npm run lint`         | ESLint                                             |
| `npm run typecheck`    | Vérification TypeScript (sans émettre de fichiers) |
| `npm run format`       | Formate tout le code (Prettier)                    |
| `npm run format:check` | Vérifie le formatage sans modifier                 |
| `npm test`             | Lance les tests une fois (Vitest)                  |
| `npm run test:watch`   | Tests en mode watch                                |

## Stack

- **Next.js 16** (App Router) + **React 19** + **TypeScript**
- **Tailwind CSS 4**
- **Vitest** + **Testing Library** pour les tests
- **ESLint** + **Prettier** pour la qualité et le formatage

## Structure

```
app/page.tsx            # sélecteur de mode (accueil)
app/layout.tsx          # layout racine : polices, métadonnées, thème
app/cs2-theme.css       # tokens de couleur du thème, sous la classe .theme-cs2
app/wordle/             # page + reducer du Wordle
app/guessr/             # page + reducer du Guessr
app/more-or-lessr/      # page + reducer du More or Lessr
app/data/cs2/           # la donnée : wordle.json, guessr_players.json, more-or-lessr.json
components/             # UI partagée (GameMenu, HelpModal, GameModeCard) + un dossier par mode
lib/                    # logique pure, testée, sans React : un dossier par mode
lib/daily/              # rotation quotidienne, barème, série, persistance (partagé)
data/modes.ts           # la liste des modes affichée sur l'accueil
```

## Architecture

Chaque mode suit le même découpage en trois couches :

1. **`lib/<mode>/`** — logique pure, sans React et sans DOM : comparaison d'une proposition,
   tirage de la cible, types partagés. C'est là que vivent les tests.
2. **`app/<mode>/reducer.ts`** — la machine à états du jeu : un `reducer` qui prend l'état
   courant et une action, et rend le nouvel état. Pas d'effet de bord, donc testable seul
   (voir les `reducer.test.ts`).
3. **`app/<mode>/*Game.tsx` + `components/<mode>/`** — l'affichage. Le composant de jeu tient
   le `useReducer` et distribue l'état aux composants de présentation.

**Le tirage de la cible** passe par `lib/daily/deck.ts`, commun aux trois jeux : **neuf
grilles quotidiennes** (six Wordle — une par longueur —, un Guessr, deux More or Lessr),
identiques pour tout le monde, qui basculent à **03:00 UTC** quel que soit le fuseau du
joueur (`lib/daily/clock.ts`).

Le tirage est une suite de permutations seedées, découpées en créneaux : un tirage ne peut
donc pas contenir deux fois la même cible. Pour les sept flux à une cible par jour (Wordle,
Guessr), une cible ne revient pas avant `⌊pool/4⌋` **jours** — 29 jours pour Guessr
(116 joueurs), 9 à 22 pour les Wordle selon la longueur. More or Lessr consomme 11 joueurs
par jour sur un pool de 28 : l'écart y vaut 12 **tirages**, soit environ une journée. Chaque
jeu garde son `lib/<mode>/selection.ts`, qui n'est plus qu'une enveloppe autour de `draw`.

**La progression** — série, points, score courant, record — vit elle aussi dans
`lib/daily/`, et n'est stockée que dans le `localStorage` : toujours aucun compte, aucune
base de données. Le barème est dans `lib/daily/scoring.ts` (une fonction pure par jeu), la
machine à états de la série dans `lib/daily/reconcile.ts`. Une fois la grille du jour
terminée, « Rejouer » bascule en **entraînement** : cible hors rotation, aucun point.

**Le thème** vit dans `app/cs2-theme.css` sous la classe `.theme-cs2`, appliquée sur le `<body>`.
Les composants consomment ses variables via des valeurs Tailwind arbitraires
(ex. `bg-[var(--surface)]`, `text-[color:var(--accent)]`) plutôt que des couleurs en dur.

## Conventions

- **Alias d'import** : `@/` pointe sur la racine du projet (ex. `import x from "@/lib/x"`).
- **Tests** : à côté du code testé, en `*.test.ts` / `*.test.tsx`
  (ex. `lib/wordle/engine.ts` → `lib/wordle/engine.test.ts`).
- **Contenu data-driven** : la donnée vit dans `app/data/cs2/`. Ajouter des joueurs = éditer
  un JSON, pas le code. Les formes attendues sont décrites par les types dans `lib/<mode>/types.ts`
  (`WordleData`, `GuessrData`, `MorelessData`).
- **Pas de `fetch` pour la donnée locale** : on `import` les JSON du repo.
- **Formatage** : ne te bats pas avec le style — `npm run format`, ou active _format on save_
  (config VS Code fournie dans [`.vscode/`](.vscode/)).
