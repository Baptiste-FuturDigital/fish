# Portraits TV et faits animaux — Design

## Objectif

Rendre le lobby plus vivant sans ajouter d'étape au parcours : le maître du jeu peut agrandir chaque portrait depuis l'écran TV, tandis que chaque invité découvre le nom de son animal et un fait étonnant après le scan.

## Décisions

- Le catalogue `shared/player-identities.ts` reste l'unique source de vérité. Chaque identité nommée contient `animalName` et `animalFact`; les anonymes partagent le poisson-clown et son fait.
- L'API expose ces deux champs dans `PlayerView`, puis dans la projection TV. Aucun calcul ni déduction depuis le nom de fichier n'est fait au runtime.
- Le résultat du scan affiche une carte dédiée entre le portrait et le banc. Le texte est court, lisible sur téléphone et déterministe.
- Dans le lobby TV, chaque tuile joueur devient un bouton. Un clic ouvre un lightbox plein écran avec le portrait, le prénom et l'animal; fond, bouton fermer et touche Échap le referment.
- Le lightbox est strictement local au navigateur TV et ne modifie pas l'état de partie.

## Contraintes

- Ne pas exposer d'identifiant technique ni de jeton sur l'API TV.
- Conserver le polling et le parcours lobby existants.
- Garder un fallback image/animal pour les invités anonymes.
- Ne pas toucher au dossier `public/` non suivi.

## Validation

- Tests unitaires du catalogue et de la projection serveur.
- Rendu statique du résultat de scan et des contrôles TV.
- Test du lightbox rendu avec photo, prénom et animal.
- Build TypeScript, suite Vitest et vérification visuelle du lobby TV.
