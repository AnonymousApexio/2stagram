# Changelog

## Non publié

### Ajouté

- Installation reproductible des outils avec versions épinglées.
- Points d'entrée minimaux React et Express.
- Configurations Docker, nginx, CI, qualité et documentation.
- Vérifications de démarrage HTTP et navigateur.

### Corrigé

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
