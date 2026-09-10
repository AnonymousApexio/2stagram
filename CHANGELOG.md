# Changelog

## Non publié

### Ajouté

- Installation reproductible des outils avec versions épinglées.
- Points d'entrée minimaux React et Express.
- Configurations Docker, nginx, CI, qualité et documentation.
- Vérifications de démarrage HTTP et navigateur.

### Corrigé

- Périmètre du socle relié au plan du projet, sept portes alignées sur la
  convention et alternatives HTTP explicitées dans l'ADR.
- Réponses HTTP 415 pour les formats non pris en charge et 400 pour les corps
  compressés invalides, au lieu d'une erreur serveur 500 générique.
- Consolidation des PR de configuration sur le squelette TypeScript : anciennes
  commandes conservées, exclusions SQLite/médias et contrôles ESLint repris.
- Documentation du pipeline alignée sur les workflows et l'amendement 0001.
- Docker attend le contrôle qualité ; rapports conservés en cas d'échec,
  actions épinglées et audit documentaire exécuté sur toutes les PR.
- Commandes annoncées sans outil installé ou configuration associée.
- Exclusion Git trop large de `db/`, qui masquait aussi les futurs schémas source.
- Installation Husky dans un dépôt Git et consignes par périmètre.
- Couverture des points d'entrée et classification des tests HTTP en intégration.
- Garde-fous ESLint frontend et séparation des états dans les instructions.
- Amendement 0001 adopté : propriété des états, classification des routes et
  exception CSS limitée au futur aperçu de retouche.
- Acceptation documentaire des deux avis image-size jusqu'au 10 octobre 2026,
  avec contrôle des causes, expiration automatique, tests et rapport npm complet.
- Audit documentaire quotidien et génération limitée à 10 minutes en CI.
