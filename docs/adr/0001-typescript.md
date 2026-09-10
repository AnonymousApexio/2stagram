# 0001 — TypeScript pour tout le projet

## Contexte

Le frontend, le backend et les contrats partagés doivent être vérifiés par le
même système de types. TypeScript strict permet de détecter des incohérences
avant l'exécution et de générer une référence technique avec TypeDoc.

## Décision

Utiliser TypeScript strict côté frontend/backend. Node 24 exécute directement le
backend par effacement des types ; shared est compilé avant ses consommateurs,
et le frontend est construit par Vite. Docusaurus présente les guides et la
référence TypeDoc dans un site documentaire séparé.

## Conséquences

Les schémas Zod partageront les types dérivés avec z.infer. Les imports relatifs
backend portent .ts. Les syntaxes non effaçables sont interdites, vérifiées par
erasableSyntaxOnly. tsc --noEmit vérifie les workspaces. Les exports applicatifs
sont nommés ; les configurations d'outils peuvent imposer un export par défaut.

Le [guide Google](https://google.github.io/styleguide/tsguide.html) est appliqué
avec Prettier à 80 colonnes, les règles de nommage et la revue de code.
Ces outils ne prouvent pas à eux seuls la conformité à toutes ses recommandations.
