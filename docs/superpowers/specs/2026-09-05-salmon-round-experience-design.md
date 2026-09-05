# Who's That Salmon — contrôle audio et reveal joueur

## Objectif

Donner au maître du jeu le contrôle de la musique Pokémon continue, laisser 30 secondes aux joueurs, faire apparaître les images révélées de bas en haut sans flou et afficher un feedback de résultat bref sans masquer l'image.

## Chronomètre et commandes

- Les quatre manches durent 30 secondes.
- Le maître du jeu conserve son bouton existant « Révéler la réponse » et peut donc avancer avant la fin si tout le monde a répondu.
- La vue maître affiche un bouton explicite « Couper la musique Pokémon » / « Relancer la musique Pokémon ».
- L'état coupé est local à la vue maître et persiste entre les quatre manches du jeu. Il n'est pas synchronisé avec les téléphones, qui ne jouent déjà pas cette musique.
- Le jingle court de début de manche reste indépendant de la musique continue.

## Animation de reveal

L'image révélée apparaît par une combinaison d'opacité, légère translation verticale et masque `clip-path` progressant du bas vers le haut. Aucun flou n'est appliqué. Le cadre, le wipe lumineux et l'étiquette de révélation peuvent rester, à condition de ne pas masquer le sujet.

## Feedback personnel

Au reveal, chaque téléphone dérive son résultat depuis `tournament.results` :

- bonne réponse : une animation verte et lumineuse affiche `+20 points` ;
- mauvaise réponse ou absence de réponse : une croix rouge animée indique immédiatement l'échec ;
- l'animation est non modale, sans fond plein, sans bouton et avec `pointer-events: none` ;
- elle apparaît au-dessus du bord inférieur de l'image, éclate puis disparaît automatiquement ;
- un texte `aria-live` annonce le résultat sans dépendre de l'animation.

Les points affichés passent par le multiplicateur de présentation existant : les 2 points internes de cette épreuve deviennent `20 points` à l'écran.

## Architecture

`SalmonRoundAudio` possède le contrôle local de lecture et conserve son état muet pendant sa durée de vie à travers les manches. `WhosThatSalmonStage` reste responsable de l'image et accepte un résultat personnel optionnel pour rendre une animation dédiée. `ChallengeScreen` sélectionne le résultat du joueur courant et ne l'envoie jamais pour le maître du jeu.

## Accessibilité et robustesse

- Le bouton audio expose son état et reste utilisable au clavier.
- Les animations respectent `prefers-reduced-motion`.
- L'absence de résultat ne provoque ni score positif ni erreur de rendu.
- Le feedback ne modifie ni score ni phase : il ne fait que présenter les données autoritaires du serveur.

## Validation

- Tests du contrôleur audio pour mute, reprise et persistance entre les manches.
- Tests du composant de reveal pour le mouvement sans flou et les verdicts `+20` / erreur.
- Tests du catalogue pour les quatre durées à 30 secondes.
- Test E2E mobile couvrant réponse, reveal anticipé et animation personnelle.

