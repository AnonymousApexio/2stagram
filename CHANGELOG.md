# Changelog

Ce fichier recense les changements notables du projet.

Le format suit [Keep a Changelog](https://keepachangelog.com/fr/1.1.0/).

## [Unreleased]

### Ajouté

- Installation reproductible des outils avec versions épinglées.
- Points d'entrée minimaux React et Express.
- Configurations Docker, nginx, CI, qualité et documentation.
- Vérifications de démarrage HTTP et navigateur.

### Modifié

- Runtime Node 24 natif pour toutes les actions de CI, documentation et E2E,
  avec versions épinglées par SHA.
- Périmètre du socle relié au plan du projet, sept portes alignées sur la
  convention et alternatives HTTP explicitées dans l'ADR.
- Consolidation des PR de configuration sur le squelette TypeScript : anciennes
  commandes conservées, exclusions SQLite/médias et contrôles ESLint repris.
- Documentation du pipeline alignée sur les workflows et l'amendement 0001.
- Docker attend le contrôle qualité ; rapports conservés en cas d'échec,
  actions épinglées et audit documentaire exécuté sur toutes les PR.
- Couverture des points d'entrée et classification des tests HTTP en intégration.
- Garde-fous ESLint frontend et séparation des états dans les instructions.
- Amendement 0001 adopté : propriété des états, classification des routes et
  exception CSS limitée au futur aperçu de retouche.
- Audit documentaire quotidien et génération limitée à 10 minutes en CI.

### Corrigé

- Réponses HTTP 415 pour les formats non pris en charge et 400 pour les corps
  compressés invalides, au lieu d'une erreur serveur 500 générique.
- Commandes annoncées sans outil installé ou configuration associée.
- Exclusion Git trop large de `db/`, qui masquait aussi les futurs schémas source.
- Installation Husky dans un dépôt Git et consignes par périmètre.

### Sécurité

- Correction de GHSA-67mh-4wv8-2f99 : remplacement ciblé d'esbuild 0.18.20
  par 0.25.12 dans l'ancien chargeur de Drizzle Kit, avec lockfile et
  autorisations d'installation alignés. Drizzle Kit reste sur sa version stable.
- Remplacement de l'action Sonar v5 signalée vulnérable par la version 8.2.1,
  avec retrait de sa dépendance à une action de cache Node 20.
- Acceptation temporaire des deux avis `image-size` pour la documentation,
  jusqu'au 2026-10-10 à 00:00 (heure de Paris, borne exclue), avec contrôle des
  causes, expiration automatique, tests et rapport npm complet. Les
  vulnérabilités restent présentes ; voir le [suivi des dépendances](docs/dependances.md).

[Unreleased]: https://github.com/AnonymousApexio/2stagram/compare/main...fix/consolider-prs
