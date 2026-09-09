# 0006 — Chaîne d'upload

## Contexte et options

Le projet utilise multer, file-type et sharp : taille, magic bytes, réencodage
image, nom aléatoire et stockage hors code. busboy brut, formidable et ffmpeg
sont écartés.

## Décision et conséquences

Les dépendances sont installées sans endpoint d'upload. Le futur éditeur client
enverra l'image originale et des paramètres validés ; le serveur produira le
rendu final. Le contrat et les limites attendent leur validation. Aucune vignette
ni transformation vidéo n'est ajoutée.

Cette fiche consigne le choix technique appliqué au squelette. Elle ne remplace
pas la revue humaine ni la validation des futures fonctionnalités.
