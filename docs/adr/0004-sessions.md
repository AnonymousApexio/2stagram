# 0004 — Sessions serveur

## Contexte et options

Les sessions doivent permettre une révocation immédiate, notamment pour la modération.
JWT et les stores SQLite tiers sont écartés au profit d'express-session et
d'un Store dédié sur better-sqlite3.

## Décision et conséquences

La dépendance est installée, mais aucun middleware de session n'est activé.
Le schéma sessions doit être validé avant cette feature. Régénération, expiration,
cookie sécurisé et révocation seront implémentés avec leurs tests.

Cette fiche consigne le choix technique appliqué au squelette. Elle ne remplace
pas la revue humaine ni la validation des futures fonctionnalités.
