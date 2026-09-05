# Qui veut gagner des poissons — verrouillage et verdict

## Objectif

Conserver l'interface à quatre choix sur le téléphone du joueur après la validation de son dernier mot, puis transformer directement son choix verrouillé lors du reveal. Le jeu ne doit plus basculer vers l'alerte générique « Réponse verrouillée » ni vers la carte blanche générique de résultat.

## Expérience joueur

- Pendant la sélection, le fonctionnement actuel, la confirmation « Est-ce votre dernier mot ? » et le joker 50/50 restent inchangés.
- Après confirmation, les choix encore présents à l'écran restent visibles et deviennent non interactifs. Le choix du joueur reste orange et porte un état accessible « Réponse verrouillée ».
- Si le joker 50/50 a été utilisé, seules les deux réponses conservées restent visibles, comme avant la validation.
- Au passage du serveur en phase `reveal`, le choix verrouillé pulse pendant environ 1,2 seconde.
- À la fin du pulse, le choix verrouillé devient vert si `result.isCorrect` est vrai, ou rouge sinon. Les autres choix conservent leur apparence bleu marine.
- La question et son palier restent visibles pendant toute la séquence.
- Une explication compacte peut rester sous les réponses après le verdict, mais aucun grand panneau blanc ne remplace l'interface du jeu.

## Architecture

`MillionaireAnswerPanel` devient un composant de présentation piloté par un mode explicite : sélection, verrouillé ou verdict. `ChallengeScreen` dérive ce mode à partir de la phase serveur, de la réponse personnelle et du résultat personnel. Le serveur reste la seule source de vérité pour la réponse et sa correction ; l'animation intermédiaire reste purement locale et ne retarde aucune mutation serveur.

Une animation CSS attachée au verdict serveur enchaîne le pulse orange et la couleur finale. Le changement de manche remonte naturellement le panneau ; un rechargement pendant le reveal rejoue l'animation, ce qui est acceptable pour cette expérience de soirée.

## Accessibilité et robustesse

- Les réponses verrouillées et révélées sont désactivées ; aucune nouvelle soumission n'est possible.
- Les états orange, vert et rouge sont complétés par du texte et des attributs accessibles, pas seulement par la couleur.
- `prefers-reduced-motion` supprime le clignotement et affiche immédiatement le verdict.
- Un joueur sans résultat explicite garde l'état verrouillé sans verdict inventé.

## Validation

- Tests du panneau pour les modes sélection, verrouillé, verdict correct et verdict faux.
- Test de `ChallengeScreen` prouvant que le reveal Millionaire n'utilise plus la carte générique.
- Test E2E mobile couvrant validation, choix orange persistant, reveal et couleur finale.
