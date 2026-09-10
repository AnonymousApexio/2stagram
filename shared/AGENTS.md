# AGENTS.md — contrat partagé et base de données

Lire ../AGENTS.md et ../backend/AGENTS.md **avant toute modification**.
backend/ est un dossier frère : ne pas supposer ses règles chargées.
Si le changement affecte le frontend, lire aussi ses consignes.

- src/schemas/ est l'unique source des schémas Zod front/back.
  Types de contrat dérivés avec z.infer, jamais recopiés dans les apps.
- Exporter explicitement les contrats publics depuis src/index.ts.
  Les apps importent @2stagram/shared sans contourner ses exports.
- Les schémas navigateur ne dépendent ni d'Express, ni de la BDD, ni de
  process.env, ni de modules natifs Node. Aucun pilote SQLite dans l'entrée
  commune consommée par le frontend.
- src/db/schema.ts est réservé au schéma Drizzle validé par le responsable BDD.
  Aucun schéma, migration ou seed métier pendant la préparation du socle.
- Pour une feature : deux phases backend (proposition et arrêt, validation,
  tests rouges, code). Toute évolution de contrat exige l'accord des
  consommateurs ; pas de duplication locale pour éviter cette coordination.
- TypeScript strict effaçable, imports relatifs .ts, exports nommés/TSDoc.
  npm run build:shared génère dist/, qui ne se modifie pas manuellement.
- Tests Zod/purs colocalisés .test.ts. Une vraie BDD se teste dans
  backend/tests/integration/ avec des ressources isolées et nettoyées.
- Vérifier les tests, le build shared et le typage de tous ses consommateurs,
  puis les contrôles communs. Ne pas valider uniquement le package partagé.
