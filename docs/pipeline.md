# Pipeline d'intégration continue

Document de conception rédigé avant implémentation, conformément à la section 3.1
de la Convention de Programmation.

Responsable : Chahinez Fahmi (DevOps)
Statut : à valider par le Tech Lead avant écriture du workflow

---

## 1. Objectif

Toute pull request déclenche automatiquement une suite de vérifications appelées
« portes ». Chaque porte doit être franchie avec succès avant que la fusion ne
soit autorisée. Une porte en échec bloque le merge, sans exception ni
contournement manuel (section 4.4).

---

## 2. Déclenchement

| Événement | Portes exécutées |
| --- | --- |
| Ouverture ou mise à jour d'une pull request vers `main` | 1 à 7 |
| Push direct sur `main` | Interdit par la protection de branche |
| Grand ajout au sens de la section 4.4 | Porte E2E en plus |

---

## 3. Les 7 portes

| # | Porte | Vérifie quoi | Commande | Échoue si | Reproduire en local |
| --- | --- | --- | --- | --- | --- |
| 1 | Prettier | Formatage uniforme du dépôt | `npm run format:check` | Au moins un fichier n'est pas formaté | `npm run format` |
| 2 | ESLint | Motifs à risque, complexité, règles de sécurité | `npm run lint` | Une règle de niveau `error` est violée | `npm run lint:fix` |
| 3 | Vitest | Tests unitaires et couverture de code | `npm run test:cov` | Un test échoue ou le seuil de couverture n'est pas atteint | `npm test` |
| 4 | SonarCloud | Analyse statique de sécurité et couverture | Action `SonarSource/sonarcloud-github-action` | La quality gate est rouge | Consulter le tableau de bord SonarCloud |
| 5 | npm audit | Vulnérabilités des dépendances (SCA) | `npm audit --audit-level=high` | Une faille `high` ou `critical` est détectée | `npm audit` |
| 6 | Build des images | Images Docker backend et frontend constructibles | `docker build` | Le build échoue | `docker compose build` |
| 7 | Revue humaine | Pertinence, lisibilité, cohérence, risques métier | Manuel | Aucune approbation d'un relecteur requis | Non applicable |

---

## 4. Ordre d'exécution

Les portes 1, 2, 3 et 5 sont indépendantes et s'exécutent en parallèle. Cela
divise environ par trois la durée totale du pipeline par rapport à une exécution
séquentielle.

La porte 4 dépend de la porte 3 : SonarCloud a besoin du fichier
`coverage/lcov.info` produit par Vitest pour afficher la couverture.

La porte 6 s'exécute une fois les portes automatiques franchies.

La porte 7 est manuelle et intervient en dernier, conformément à la section 8.1
qui veut que l'analyse automatique précède l'analyse humaine.

---

## 5. Porte E2E (tests de bout en bout)

Outil retenu : Playwright.

Déclenchement : uniquement sur « grand ajout » au sens de la section 4.4, c'est
à dire nouvelle intégration externe, changement de schéma de base de données,
nouvelle route, modification d'un composant critique ou refactorisation
transverse.

Périmètre limité à trois parcours critiques :

- inscription et connexion
- publication d'un contenu
- signalement et modération

Le parcours de messagerie instantanée reste testé manuellement, le coût
d'automatisation d'un flux temps réel n'étant pas justifié à l'échelle du projet.

---

## 6. Formats et artefacts

| Artefact | Produit par | Consommé par |
| --- | --- | --- |
| `coverage/lcov.info` | Porte 3 | Porte 4 |
| Rapport de couverture | Porte 3 | Artefact téléchargeable sur la PR |
| SBOM (`npm sbom`) | Porte 5 | Inventaire des dépendances (section 8.5) |
| Images Docker | Porte 6 | Vérification uniquement, non publiées |

---

## 7. Gestion des secrets

Aucun secret n'est stocké dans le dépôt, y compris dans l'historique Git
(section 6.7).

- Les valeurs sensibles sont stockées dans GitHub Secrets.
- Le fichier `.env` est exclu par le `.gitignore`.
- Le fichier `.env.example` documente les variables attendues sans valeur réelle.
- Les jobs du workflow utilisent des permissions minimales.
- Les actions tierces sont épinglées pour éviter la substitution de version.

Références : OWASP CI/CD Security et GitHub Actions Security (section 10.3).

---

## 8. Décisions à valider par le Tech Lead

| Sujet | Proposition | Justification |
| --- | --- | --- |
| Seuil de couverture bloquant | À fixer avec l'équipe | La section 7.3 laisse le seuil à la décision de l'équipe |
| Seuil de `npm audit` | `--audit-level=high` | `drizzle-kit` embarque un chargeur esbuild signalé `moderate`. L'avis concerne le serveur de développement d'esbuild, pas un usage en CLI. Un seuil `moderate` bloquerait le pipeline en permanence sans risque réel. |
| Portée de Playwright | Trois parcours critiques | Un périmètre complet ne serait pas maintenable sur la durée du projet |
| Branche cible | À confirmer | La section 4.1 mentionne `develop` dans le texte mais ne la liste pas dans le tableau des branches |

---

## 9. Comportement attendu côté développeur

Avant de pousser, lancer localement :

```bash
npm run format
npm run lint
npm test
```

Les hooks pré-commit (par ex. Husky et lint-staged), si mis en place, peuvent exécuter automatiquement le
formatage et le linting sur les fichiers modifiés, ce qui évite la majorité des
échecs de portes 1 et 2.

En cas de porte rouge, le journal du job indique la commande exacte qui a échoué.
La reproduire en local est toujours possible avec les commandes du tableau de la
section 3.
