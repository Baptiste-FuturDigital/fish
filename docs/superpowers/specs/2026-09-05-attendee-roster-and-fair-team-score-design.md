# Participants absents et score équitable des bancs

## Objectif

Retirer Jérémy et Valentine des participants proposés sans supprimer d'asset, conserver quatre bancs équilibrés et neutraliser l'avantage mécanique d'un membre supplémentaire dans le seul jeu où les points de chaque joueur sont additionnés au score du banc.

## Catalogue des participants

- Jérémy est retiré de `invitedPlayerIdentities`. Son fichier `assets/players/jeremy-phoque.png` reste intact.
- Valentine n'existe déjà ni dans le catalogue ni dans les assets ; aucune suppression n'est nécessaire.
- Le catalogue passe de 17 à 16 invités nommés. Avec les 16 présents annoncés, l'algorithme d'attribution existant produit quatre bancs de quatre.
- Le profil « Autre invité » reste disponible pour les imprévus.

## Modèle d'équité

Les scores individuels ne sont jamais normalisés : un joueur garde exactement les points qu'il a gagnés.

Pour les scores de banc :

- `Le juste poisson` reste inchangé : un seul meilleur résultat représente déjà chaque banc.
- `Question pour un poisson` reste inchangé : le buzzer produit un seul résultat de banc.
- `Qui veut gagner des poissons` reste inchangé : un banc n'est crédité qu'une fois par manche, quel que soit le nombre de bonnes réponses individuelles.
- `Who's That Salmon` est normalisé car il additionne aujourd'hui chaque bonne réponse individuelle.

Pour une manche Salmon, soit `M` la taille du plus grand banc actif et `n` la taille du banc évalué. Le score du banc devient :

`somme des points corrects × M / n`

Ainsi, un banc de trois joueurs ayant 100 % de bonnes réponses reçoit le même score qu'un banc de quatre joueurs ayant 100 % de bonnes réponses. Les valeurs décimales sont conservées côté calcul et l'affichage final utilise l'arrondi de présentation existant. Les bancs vides reçoivent zéro.

## Architecture

`aggregateTeamResults` reçoit les tailles des bancs en plus des identifiants participants. `GameService` construit cette information à partir des joueurs effectivement affectés au lancement. La normalisation est appliquée au moment autoritaire du reveal, avant l'écriture des résultats et l'incrément du score du banc. Aucun correctif tardif ou uniquement visuel n'est appliqué au classement final.

Cette approche garantit que les classements intermédiaires, final, TV et les récompenses utilisent tous le même score persistant.

## Validation

- Tests du catalogue prouvant que Jérémy et Valentine ne sont pas sélectionnables et que l'image de Jérémy existe toujours.
- Tests d'attribution prouvant une répartition 4/4/4/4 avec les 16 invités.
- Tests d'agrégation Salmon comparant des bancs de trois et quatre à taux de réussite identique.
- Tests de non-régression prouvant que les trois autres jeux conservent leur barème actuel.

