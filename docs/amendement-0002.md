# Amendement 0002 — Avis braces de la documentation

Version 1.0, adoptée le 5 octobre 2026 par le responsable technique.
Cet amendement remplace l'exception documentaire du paragraphe 4 de
l'[amendement 0001](./amendement-0001.md), qui visait les deux avis `image-size`.

## 1. Pourquoi

Les deux avis `image-size` sont corrigés : le site documentaire utilise la
version 2.0.4. Il reste un avis de niveau haut sans correctif publié,
[GHSA-vfj7-8cjw-p6xm](https://github.com/advisories/GHSA-vfj7-8cjw-p6xm), sur
`braces` jusqu'à la version 3.0.3, qui est la dernière. Il atteint 28 paquets
par `micromatch`, dont les modules `@docusaurus/`. Sans acceptation, l'audit
documentaire reste en échec sans qu'aucune mise à jour puisse le corriger.

## 2. Décision

Le responsable technique accepte cet avis, exclusivement dans la génération
Docusaurus. L'acceptation commence le 5 octobre 2026 à 00:00 (heure de Paris)
et expire le 1er janvier 2027 à 00:00 (heure de Paris), borne exclue, sans
reconduction automatique. Le projet est un projet scolaire : l'échéance est
choisie pour couvrir son déroulement, sans engagement au-delà.

Les mesures de l'amendement 0001 restent applicables : Docusaurus hors
workspaces et images applicatives, contenus revus uniquement, build manuel sur
un runner distinct, audit quotidien et rapport npm complet conservé en artefact.

## 3. Contrôle

`scripts/docs-audit-policy.ts` applique cette décision. Une alerte haute n'est
acceptée que si aucun correctif n'est signalé et si chacune de ses causes,
suivie dans la chaîne de dépendances, aboutit à cet unique avis. Une autre
cause, une alerte critique, un correctif disponible, un rapport incomplet ou
l'expiration bloquent le contrôle. Si `braces` publie un correctif, il faut
l'installer et supprimer cette exception.

`npm run audit:docs:strict` reste sans exception et en échec tant que l'avis
subsiste. L'audit applicatif n'est pas concerné.
