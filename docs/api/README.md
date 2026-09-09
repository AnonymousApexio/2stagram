# Documentation technique et contrat d'API

`npm run docs:api` génère la référence **TypeScript avec TypeDoc** dans
`docs/api/generated/`, à partir des exports et de leurs commentaires TSDoc.
Elle est accessible dans le site de documentation, rubrique Référence TypeScript.

Le futur contrat **OpenAPI** sera généré séparément depuis les schémas Zod de
`shared/src/schemas/`, avec `zod-openapi`. `swagger-ui-dist` est installé, mais
aucune route de documentation ni route métier n'est montée dans le squelette.
Les détails de pagination, de sessions et de réponses attendent les contrats.

Le préfixe retenu pour les futurs routeurs est `/api/v1`. nginx et le proxy Vite
transmettent ce chemin sans suppression ni ajout du préfixe.
