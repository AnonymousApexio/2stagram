# 0003 — HTTP — Express

## Contexte et options

Express 5.2.1 fournit la couche HTTP et les middlewares du projet. Conserver
un framework unique facilite leur intégration et la séparation des responsabilités.

Les options examinées dans la stack sont Node natif, Fastify, Koa et Hono.
Node natif demanderait de gérer le routage, les corps limités et les erreurs
HTTP dans le projet. Les autres frameworks ne sont pas retenus afin de garder
une intégration directe des middlewares Express choisis : express-session,
multer, helmet et express-rate-limit. Aucune substitution n'est introduite.

## Décision et conséquences

Le socle démarre avec Express, sans route métier. L'adaptation HTTP reste dans
routes/controllers, la logique dans les services et la persistance dans les
repositories. Cela limite le couplage au framework et facilite les tests.

Cette fiche consigne le choix technique appliqué au squelette. Elle ne remplace
pas la revue humaine ni la validation des futures fonctionnalités.
