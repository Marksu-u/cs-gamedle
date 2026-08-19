# strikedle

Trois mini-jeux sur la scène **Counter-Strike 2**. Même donnée, trois façons d'y jouer.
Gratuit, sans compte, sans base de données.

| Mode              | Route            | Principe                                                                         |
| ----------------- | ---------------- | -------------------------------------------------------------------------------- |
| **Wordle**        | `/wordle`        | Cinq pseudos de pros tirés au hasard, 6 essais chacun, indices couleur.          |
| **Guessr**        | `/guessr`        | Retrouve un pro via ses attributs : équipe, rôle, nationalité, âge…              |
| **More or Lessr** | `/more-or-lessr` | Deux pros, une stat cachée : plus ou moins ? 10 rounds, tournois ou prize money. |

La page d'accueil (`/`) est le sélecteur de mode. Elle affiche aussi la série en cours, le
score courant, le record et le compte à rebours vers la prochaine rotation.

**Huit grilles par jour**, les mêmes pour tout le monde, renouvelées à **03:00 UTC** :
cinq Wordle, une pour Guessr, une par catégorie de More or Lessr (2). Chaque
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
app/[locale]/page.tsx        # sélecteur de mode (accueil)
app/[locale]/layout.tsx      # layout racine : polices, métadonnées, thème
app/[locale]/wordle/         # page + reducer + composant de jeu du Wordle
app/[locale]/guessr/         # page + reducer + composant de jeu du Guessr
app/[locale]/more-or-lessr/  # page + reducer + composant de jeu du More or Lessr
app/[locale]/legal/          # + privacy, terms, cookies : les quatre pages légales
app/opengraph-image.tsx      # image de partage, une par langue — hors [locale] à dessein
app/sitemap.ts               # sitemap, robots.ts, icônes : hors segment de langue
app/cs2-theme.css            # tokens de couleur du thème, sous la classe .theme-cs2
app/data/cs2/                # la donnée : wordle.json, guessr_players.json, more-or-lessr.json
components/                  # UI partagée (GameMenu, HelpModal, GameModeCard) + un dossier par mode
lib/                         # logique pure, testée, sans React : un dossier par mode
lib/daily/                   # rotation quotidienne, barème, série, persistance (partagé)
lib/share/                   # partage : tons, carte partagée, rendus texte et image, presse-papiers
data/modes.ts                # la liste des modes affichée sur l'accueil
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

**Le tirage de la cible** passe par `lib/daily/deck.ts`, commun aux trois jeux : **huit
grilles quotidiennes** (cinq Wordle, un Guessr, deux More or Lessr),
identiques pour tout le monde, qui basculent à **03:00 UTC** quel que soit le fuseau du
joueur (`lib/daily/clock.ts`).

Le tirage est une suite de permutations seedées, découpées en créneaux : un tirage ne peut
donc pas contenir deux fois la même cible. Pour Guessr, seul flux à une cible par jour, une
cible ne revient pas avant `⌊pool/4⌋` **jours** — 29 jours pour 116 joueurs. Wordle tire six
pseudos par jour sur le flux `wordle`, le sixième ne servant que de rechange au garde
anti-fuite : sur un dico de 341 pseudos, l'écart y vaut 85 **tirages**, soit une quinzaine de
jours. More or Lessr consomme 11 joueurs par jour sur un pool de
28 : l'écart y vaut 12 **tirages**, soit environ une journée. Chaque
jeu garde son `lib/<mode>/selection.ts`, qui n'est plus qu'une enveloppe autour de `draw`.

**La progression** — série, points, score courant, record — vit elle aussi dans
`lib/daily/`, et n'est stockée que dans le `localStorage` : toujours aucun compte, aucune
base de données. Le barème est dans `lib/daily/scoring.ts` (une fonction pure par jeu), la
machine à états de la série dans `lib/daily/reconcile.ts`. Une fois la grille du jour
terminée, « Rejouer » bascule en **entraînement** : cible hors rotation, aucun point.

**Le partage** vit dans `lib/share/`. La règle : le texte partagé montre **la forme de la
partie, jamais le contenu de la réponse**. La grille d'emojis du Wordle sort des
`evaluations`, celle du Guessr des lignes de proposition — sans les pseudos essayés, qui
sont eux-mêmes un spoiler, et sans les lignes d'indice, qui révéleraient quelle colonne est
connue. More or Lessr partage la bande ✅/❌ de ses dix rounds. L'accueil partage la journée
entière : une case par grille, plus le score et la série.

Les constructeurs de `lib/share/format.ts` ne rendent pas une chaîne mais une **carte**
(`lib/share/card.ts`) : un titre, une ligne de détail, et des lignes de _tons_
(`correct`, `present`, `missed`, `blank`…). Deux rendus la consomment, et aucun des deux
ne connaît l'autre — ajouter un mode, c'est construire une carte, pas toucher aux rendus.
`cardToText` produit le bloc d'emojis, `lib/share/image.ts` le peint sur un canvas. Les
tuiles y sont des rectangles et non les emojis : sur un canvas, ceux-ci sont rendus par la
police système, à ses métriques, et la grille cesse d'être alignée.

Ces constructeurs restent des fonctions pures qui reçoivent un traducteur en paramètre —
d'où des tests joués contre les **vrais** catalogues dans les deux langues
(`format.test.ts`), qui vérifient à la fois qu'aucune clé brute ne fuit et qu'aucune réponse
n'apparaît.

`lib/share/useShare.ts` envoie **les deux charges en un seul clic** : un `ClipboardItem`
qui porte à la fois `image/png` et `text/plain`. Discord ou X collent l'image, un champ de
texte brut colle les carrés. C'est ce qui permet de préférer l'image sans rien perdre :
une image collée dans un salon n'est pas cliquable, donc le lien ne survit que par le
texte — et l'adresse est en plus dessinée dans l'image. Sur mobile (pointeur tactile), le
fichier part dans la feuille de partage de l'OS via `canShare({ files })`.

La dégradation reste la règle : image, puis texte, puis `<textarea>` + `execCommand` en
origine non sécurisée, puis un libellé d'échec — jamais d'exception. Un navigateur sans
`ClipboardItem` ou sans canvas retombe exactement sur l'ancien comportement. Le lien final
passe par `pageUrl(path, locale)` : un joueur francophone partage une URL en `/fr`.

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

## Licence

Le code de ce dépôt est publié sous **licence MIT** — voir [`LICENSE`](LICENSE).
Vous êtes libre de le réutiliser, le modifier et le redistribuer, en conservant la
mention de copyright.

**La licence ne couvre que le code.** Les jeux de données joueurs
(`app/data/cs2/`) sont des résultats factuels de compétition, et non une œuvre
originale de l'éditeur : celui-ci ne concède donc aucun droit dessus. Quiconque les
réutilise répond de sa propre situation au regard du droit d'auteur, du droit sui
generis des bases de données et de la protection des données personnelles. Cloner
ce dépôt ne vous transmet pas une autorisation sur la donnée, parce qu'il n'y en a
aucune à transmettre.

**Counter-Strike**, **Counter-Strike 2** et les marques associées appartiennent à
**Valve Corporation**. Ce projet est un projet de fan indépendant, sans affiliation,
approbation ni parrainage de Valve. Aucun asset du jeu n'est reproduit ici — le
thème (`app/cs2-theme.css`) rejoue une palette, pas des fichiers.

Ces trois paragraphes sont la version courte des pages légales du site
(`/legal`, `/privacy`, `/terms`, `/cookies`), dont les textes vivent dans
`messages/` sous la clé `legalPages` et les constantes dans
[`lib/legal.ts`](lib/legal.ts). **En cas de divergence, ce sont les pages du site
qui font foi** : ce README les résume, il ne les remplace pas. Un fork qui change
d'éditeur doit reprendre `lib/legal.ts` avant toute mise en ligne — il y tient
l'alias de l'éditeur, le contact et l'hébergeur.

Un point à ne pas perdre de vue, et il est documenté en tête de `lib/legal.ts` :
le site n'affiche ni nom réel ni adresse postale parce qu'il relève du régime
**non professionnel** de l'article 6-III-2 de la LCEN. Cela cesse d'être vrai le
jour où le site rapporte quoi que ce soit — publicité, bouton de don, parrainage,
offre payante. L'éditeur devient alors professionnel au sens du 6-III-1, et les
mentions doivent porter son identité complète.
