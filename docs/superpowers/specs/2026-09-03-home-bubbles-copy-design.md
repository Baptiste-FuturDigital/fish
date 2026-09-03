# Accueil — bulles et nouvelle accroche

## Objectif

Rendre l'accueil de Fish Party plus vivant sans modifier son parcours, ses formulaires ni le contenu déjà validé hors du hero.

## Design retenu

- Remplacer les trois bulles statiques actuelles par un champ de douze bulles décoratives.
- Varier tailles, positions, vitesses et dérive latérale avec des animations CSS uniquement.
- Garder les bulles derrière le contenu, sans interaction et masquées aux technologies d'assistance.
- Respecter `prefers-reduced-motion` pour supprimer le mouvement si l'utilisateur le demande.
- Remplacer le texte du hero par :
  - badge : « C'EST L'HEURE DU DUEL » ;
  - titre : « Quels poissons seront dignes de Poséithon ? 🔱 » ;
  - description : « Merci de vous donner à fond marin et de ne pas crevette durant les épreuves. Les champions seront honorés d'une faveur divine. »

## Idées de jeux conservées pour la suite

- « Question pour un poisson »
- « Le juste poisson »
- « Le poisson faible »
- « Qui veut gagner les poissons ? »

## Validation

Le test mobile du parcours complet vérifiera les nouveaux textes, le nombre de bulles décoratives et l'absence de régression sur la création, l'arrivée d'un second joueur, le démarrage, les manches et la fin de partie.
