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
  - description : « Merci de vous donner à fond marin et de ne pas crevette durant les épreuves. Les poissons victorieux seront récompensés d'une faveur divine. »

## Idées de jeux conservées pour la suite

- « Question pour un poisson »
- « Le juste poisson »
- « Le poisson faible »
- « Qui veut gagner des poissons ? »

## Génériques d'introduction conservés

- Générique Game Show par défaut : `https://www.youtube.com/watch?v=UaRrDZWhtWA&list=RDUaRrDZWhtWA&start_radio=1`
- « Qui veut gagner des poissons ? » : `https://www.youtube.com/watch?v=doSjY-DGmjY&list=PL7BUuXWlhkL7vcHkVAXgqX0pvyTk1Hd8V&index=18`
- « Question pour un poisson » : `https://www.youtube.com/watch?v=Zcl98Bguq7k&list=PL7BUuXWlhkL7vcHkVAXgqX0pvyTk1Hd8V&index=17`
- Chaque musique démarre comme générique d'introduction au lancement du jeu correspondant.
- La musique déjà intégrée à l'accueil (`8g8Utx0gvv8`) reste la musique d'ambiance par défaut.

## Validation

Le test mobile du parcours complet vérifiera les nouveaux textes, le nombre de bulles décoratives et l'absence de régression sur la création, l'arrivée d'un second joueur, le démarrage, les manches et la fin de partie.
