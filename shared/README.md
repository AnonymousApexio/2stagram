# Contrat partagé

Futur point commun des schémas Zod et des types front/backend ; schéma Drizzle
dans src/db/. Le module est vide tant que ces contrats ne sont pas validés.
Lire AGENTS.md et ses renvois avant toute modification.

Depuis la racine : npm ci puis npm run build:shared.
npm run typecheck vérifie tous les consommateurs. npm test découvre les tests
partagés colocalisés lorsqu'ils existent ; aucune suite shared n'est simulée.

Les consommateurs importent @2stagram/shared. dist/ est généré, non versionné.
