# Portraits joueurs dans les classements intermédiaires

## Objectif

Permettre d’ouvrir la photo d’un joueur depuis « La grille des poissons » affichée après les épreuves 1, 2 et 3, avec la même expérience que dans le classement final.

## Interaction

- Chaque ligne possédant une photo est un bouton accessible nommé « Agrandir la photo de {joueur} ».
- Le clic ouvre `PlayerPortraitLightbox`, déjà utilisé par le classement final.
- La lightbox affiche la photo, le nom et l’animal du joueur.
- Elle se ferme avec son bouton, un clic sur l’arrière-plan ou la touche Échap.
- Un joueur sans photo reste visible dans le classement, mais sa ligne est désactivée et ne peut pas ouvrir de lightbox.

## Architecture

- Centraliser la conversion `PlayerView` vers `PortraitPlayer` à côté de la lightbox pour éviter une seconde logique de fallback.
- Faire porter l’état de sélection au composant `PlayerLeaderboard`, qui est la grille réutilisée par tous les classements intermédiaires.
- Conserver `LeaderboardScreen`, les données de classement et le scoring inchangés.
- Préserver la hiérarchie valide `ol > li > button`, la navigation clavier et les styles de focus.

## Présentation

La grille conserve son langage visuel actuel de course sous-marine. Seuls les affordances interactives sont ajoutées : curseur, focus visible et léger mouvement au survol sur les appareils compatibles. La lightbox reste visuellement identique à celle du classement final.

## Validation

- Test unitaire du mapping photo directe, fallback totem et absence de photo.
- Test de rendu vérifiant les boutons accessibles et l’état désactivé sans image.
- Test end-to-end ouvrant puis fermant le portrait depuis un classement intermédiaire.
- Suite Vitest complète, build de production et E2E ciblé avant déploiement.
- Vérification de santé locale et publique après déploiement Raspberry Pi.

## Déploiement et retour arrière

Le déploiement utilise le script Raspberry Pi existant avec sauvegarde SQLite et contrôle de santé. Aucun changement de schéma ni migration n’est requis ; le retour arrière consiste à redéployer le commit précédent.
