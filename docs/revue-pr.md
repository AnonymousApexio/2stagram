# Revue d'une pull request

Utiliser le diff par rapport à la branche cible. Si le dépôt n'a pas encore de
commit de base, le signaler ; ne pas inventer de comparaison. Une demande de
revue seule est en lecture seule, sauf correction explicitement demandée.

> Applique AGENTS.md et les consignes des périmètres touchés. Relis cette PR
> par rapport à sa fiche validée. Priorise les défauts de comportement,
> sécurité et régression. Pour chaque constat : fichier/ligne, déclencheur,
> impact, preuve et correction proposée. Distingue blocages et suggestions.
> N'invente pas de résultats de tests ou de validations.

## Points à vérifier

- Besoin et critères satisfaits ; aucune feature inventée hors périmètre.
- Backend : routes/tests approuvés, preuve rouge avant implémentation, assertions
  qui détectent vraiment une absence de permissions sur la ressource précise.
- Cas limites de la fiche, notamment concurrence, rejeu et échec partiel.
- Entrées parsées Zod réellement utilisées, pas de recopie de schéma/type.
- Séparation HTTP/services/repositories, requêtes paramétrées, ressources libérées.
- Frontend : services/Query, aucun cache serveur dupliqué dans Zustand,
  CSS Modules/tokens, états, accessibilité et rendu aux trois largeurs.
  Pour l'aperçu de retouche, seules les variables numériques bornées de
  l'amendement 0001 sont autorisées ; vérifier leur validation et la portée du lint.
- Aucun secret dans code/logs ; session, origine, upload et permissions vérifiés
  selon les fiches OWASP pertinentes.
- Tests isolés en unitaire ; tests HTTP/BDD classés en intégration.
  Expliquer ce qui ferait échouer l'assertion, pas seulement ce qui est exécuté.
- Checks exécutés, couverture >=70 % lignes/branches sur le code changé et
  couverture globale stable/en hausse. Les exclusions ne cachent pas du métier.
- Dépendances auditées, documentation/contrat/ADR/changelog à jour.
- Documentation : rapport npm complet joint ; seules les deux causes image-size
  approuvées peuvent être acceptées avant l'échéance de l'amendement 0001.
- Taille de PR raisonnable (400 lignes de code hors généré/lockfiles) ou exception.
- Grand ajout évalué selon l'impact, sans déclenchement par la seule création
  d'une route ; E2E requis exécutés et tests HTTP adaptés présents.

## Relecteurs et décision

Le responsable technique relit les PR. Ajouter le responsable BDD pour BDD, le responsable DevOps pour CI/infra, le responsable design pour
la maquette et responsable technique/Scrum Master pour la revue de sécurité
(auth, permissions, entrées externes, uploads ou données personnelles).
La revue assistée ne remplace pas leur approbation.
Lister les contrôles non effectués et ne pas conclure « conforme » s'ils manquent.
