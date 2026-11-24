# Backend

Express 5 exécuté en TypeScript natif sous Node 24. Aucune route métier active.
Lire AGENTS.md avant une feature ; les règles racine s'appliquent aussi.

Depuis la racine : npm ci, npm run setup, puis npm run dev:backend.
npm run build:shared précède le démarrage automatiquement.
Tests : npm test -w @2stagram/backend ; typage : npm run typecheck.

Les tests unitaires sont colocalisés dans src/, les tests HTTP/BDD dans
tests/integration/. Les couches métier réservées restent vides.

## Base de données

Schéma : shared/src/db/schema.ts (docs/db/). Connexion : src/lib/database.ts,
toujours ouverte par openDatabase() pour appliquer les pragmas.
Migrations générées dans drizzle/ par
npm run db:generate -- --name <description>.
Toute migration qui crée ou reconstruit sessions doit être corrigée à la main
pour idx_sessions_user_id (commentaire dans schema.ts).
Seed de développement : npm run db:seed, sur une base vide, avec
NODE_ENV=development dans le fichier .env (voir .env.example).
