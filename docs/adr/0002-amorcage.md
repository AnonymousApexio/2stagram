# 0002 — Installation reproductible du squelette

## Contexte

Les commandes annoncées doivent fonctionner après installation, avec les mêmes
versions pour tous les contributeurs. Le périmètre reste la préparation du
socle technique, sans implémentation anticipée des fonctionnalités.

## Décision

Épingler les versions des outils et conserver leurs lockfiles. Les types, la
configuration ESLint, le plugin React de Vite et les dépendances documentaires
font partie de cette installation. Une nouvelle dépendance ou une mise à jour
nécessite un accord explicite du responsable technique.

Conserver trois workspaces, compiler shared et le frontend, exécuter le backend
TypeScript directement avec Node 24. Docusaurus dispose de son propre manifeste
et de son propre lockfile, hors workspaces. Les exports par défaut sont réservés
aux configurations d'outils qui les demandent.

## Conséquences

Aucune table, migration, authentification, route métier ou page fonctionnelle
n'est implémentée. Les dossiers existants restent disponibles pour les futures
tâches. Les vérifications du socle ne valident pas les futurs parcours utilisateur.
