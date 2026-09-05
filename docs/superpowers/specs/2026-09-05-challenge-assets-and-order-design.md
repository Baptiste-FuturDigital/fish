# Images et ordre des épreuves — Design

## Objectif

Réparer toutes les images de jeu après leur déplacement dans `assets/game` et imposer l’ordre définitif des quatre épreuves.

## Cause racine

Vite publie le dossier `assets` à la racine HTTP. Les cinq manches du Juste poisson et deux images réutilisées par Question pour un poisson pointent encore vers `/poids-*`, alors que les fichiers sont désormais dans `/game/Le juste poisson/`. Le générique de Who's that salmon référence `whos-that-salmon-template.png`, fichier qui n’existe plus. Les huit images guess/reveal Salmon sont, elles, présentes et accessibles.

## Décisions

- Centraliser la racine publique du Juste poisson dans sa définition et l’utiliser pour ses cinq manches.
- Mettre à jour les images réutilisées par Question pour un poisson vers la même racine.
- Utiliser la première silhouette Salmon comme image d’introduction, seul visuel de présentation actuellement disponible dans ce dossier.
- Définir l’ordre canonique : Le juste poisson, Question pour un poisson, Qui veut gagner des poissons, Who's that salmon.
- Conserver la normalisation existante au démarrage : même une partie créée avant cette correction adopte l’ordre canonique tant qu’elle est encore au lobby.
- Ajouter un test de contrat parcourant toutes les images locales du catalogue et vérifiant que le fichier correspondant existe réellement sous `assets`.

## Validation

- Le test de contrat couvre les images d’introduction, de manche et de révélation.
- Les tests du catalogue vérifient l’ordre et les 19 manches.
- Les URL sont testées contre le serveur Docker afin de refuser les fallbacks HTML trompeurs.
- Suite Vitest, build TypeScript/Vite et parcours navigateur sans image cassée.
