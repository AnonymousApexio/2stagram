# Backend

Express 5 exécuté en TypeScript natif sous Node 24. Aucune route métier ni BDD
active. Lire AGENTS.md avant une feature ; les règles racine s'appliquent aussi.

Depuis la racine : npm ci, npm run setup, puis npm run dev:backend.
npm run build:shared précède le démarrage automatiquement.
Tests : npm test -w @2stagram/backend ; typage : npm run typecheck.

Les tests unitaires sont colocalisés dans src/, les tests HTTP/BDD dans
tests/integration/. Les couches métier réservées restent vides.
