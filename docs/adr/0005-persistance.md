# 0005 — SQLite et Drizzle

## Contexte et options

La stack retient better-sqlite3 et Drizzle ORM, avec drizzle-kit pour les
migrations. Prisma et les autres pilotes sont écartés ; un seul backend est prévu.

## Décision et conséquences

Le schéma appartient au responsable BDD. Aucun schéma temporaire ni migration
n'est généré dans le socle. WAL, clés étrangères, concurrence, seed et sauvegardes
seront validés avec la BDD et l'infrastructure. Le volume est seulement réservé.

Cette fiche consigne le choix technique appliqué au squelette. Elle ne remplace
pas la revue humaine ni la validation des futures fonctionnalités.
