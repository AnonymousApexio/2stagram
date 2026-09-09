# 2stagram

Squelette TypeScript avec React, Express et un contrat partagé.
Le périmètre actuel est décrit dans [docs/socle.md](docs/socle.md).

Pour contribuer avec Codex : [guide équipe](docs/equipe.md).
Pour les contrôles et limites : [audit du squelette](docs/conformite.md).
Pour les arbitrages applicables : [amendement 0001](docs/amendement-0001.md).

## Démarrer en développement

Prérequis : Node 24.15 ou plus récent dans la branche 24, npm 11 ou 12.
La version Node est indiquée dans `.nvmrc`.

```bash
npm ci
npm run setup
npm run dev
```

Ouvrir http://127.0.0.1:5173. Le frontend affiche seulement le titre `2stagram`.
Express écoute sur le port 3000 ; aucune route métier n'est implémentée.
Le serveur renvoie des erreurs JSON aux routes inconnues.

`npm run setup` crée un `.env` local avec un secret aléatoire sans écraser un
fichier existant. `npm run dev` surveille les trois workspaces. `Ctrl+C` arrête
les processus lancés. Le build de `shared` précède le démarrage.

## Docker

Prérequis : Docker Engine et Docker Compose.

```bash
npm run setup
npm start
```

Ouvrir http://127.0.0.1:8080. Si le port est occupé, modifier `WEB_PORT` dans
`.env`. `npm run stop` arrête les conteneurs en conservant les volumes.

Les images finales utilisent un utilisateur non-root. nginx sert le frontend
et transmet `/api/` et `/socket.io/` sans réécriture. Les volumes `db` et `media`
sont réservés ; le squelette ne crée aucune table ni migration. Les compilateurs
nécessaires aux modules natifs restent dans les étapes de construction.

## Vérifier la base

```bash
npm run check              # format, lint, types, tests, couverture, build
npm run audit:dependencies
npm exec --no -- playwright install chromium
npm run test:smoke         # démarrage navigateur à 360, 768 et 1280 px
```

Le contrôle navigateur utilise le port 4183, ajustable via `SMOKE_PORT`.
`npm test` vérifie l'application HTTP, le cycle de vie du serveur et le montage
React, ainsi que la politique d'exception documentaire. Les sources applicatives
sont toutes incluses dans la couverture, y
compris les points d'entrée. Les schémas shared et les parcours métier sont vides.
`npm run test:e2e` est réservé aux futurs parcours inscription, publication et
signalement : il échoue avec « No tests found » tant qu'ils ne sont pas écrits.
Le dossier `tests/e2e/` sera créé avec le premier parcours. Les rapports
`coverage/` et `test-results/` sont générés à la demande et ignorés par Git ;
ils peuvent être supprimés sans retirer les fichiers de tests.

## Documentation

```bash
npm ci --prefix docs-site
npm run docs:site
npm run docs:dev
```

TypeDoc génère la référence TypeScript dans `docs/api/generated`. Docusaurus
publie les pages de `docs/` et cette référence ; il possède son propre lockfile,
hors workspaces. Le site démarre sur http://localhost:3001.
La documentation OpenAPI sera générée depuis les futurs schémas Zod, une fois
les contrats disponibles. Le squelette ne publie pas d'API de démonstration.

`npm run audit:docs` conserve le rapport complet et applique l'exception limitée
aux deux avis image-size jusqu'au 10 octobre 2026 à 00:00 (heure de Paris) exclu. Les nouvelles
alertes hautes/critiques et l'expiration restent bloquantes. `npm run audit:docs:strict`
exécute le contrôle sans exception. Voir [le suivi](docs/dependances.md).

## Organisation

```text
backend/src/      entrée HTTP, dossiers des futures couches métier
frontend/src/     entrée React, variables CSS provisoires, dossiers réservés
shared/src/       futur contrat partagé Zod et schéma Drizzle
scripts/          commandes d'amorçage, développement et documentation
infra/            reverse proxy nginx
tests/            contrôles navigateur et futurs parcours E2E
docs/             utilisation, outillage, périmètre et décisions
```

Les sources backend restent en TypeScript exécuté par Node ; leurs imports
relatifs portent `.ts`. `shared` est compilé avec `tsc`, le frontend avec Vite.

Les règles de contribution sont dans les quatre `AGENTS.md` : racine, frontend,
backend et shared. Les hooks
Husky s'activent lors de `npm ci` si le dossier contient `.git`. Pour une archive,
initialiser le dépôt avec `git init -b main`, puis `npm run prepare`.
Les workflows et les réglages externes à activer sont décrits dans
[docs/outillage.md](docs/outillage.md).
