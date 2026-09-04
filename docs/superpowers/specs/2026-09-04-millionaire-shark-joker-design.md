# Qui veut gagner des poissons — design

## Décision

L’épreuve adopte un plateau télévisé sous-marin bleu nuit et or, inspiré des codes du quiz à quatre choix sans recopier sa marque. L’introduction utilise un portrait généré de Jean-Pierre Foucault fusionné avec un requin, puis lance le générique existant `doSjY-DGmjY` uniquement sur l’appareil hôte.

## Joker 50/50

- Chaque banc possède exactement un joker pour toute l’épreuve.
- Un membre peut l’activer pendant une question, avant de choisir sa réponse.
- Le serveur conserve la bonne réponse et une mauvaise réponse choisie de façon déterministe, puis persiste le résultat.
- La consommation est atomique : deux téléphones du même banc ne peuvent pas utiliser deux jokers simultanément.
- Tous les membres du banc voient les deux mêmes choix restants au prochain polling.
- Les autres bancs gardent leur propre joker.

## Interface

- Question centrale dans une capsule lumineuse.
- Réponses A/B/C/D dans des boutons bleu profond à bordure blanche et accent or.
- Grille une colonne sur petit mobile, deux colonnes dès que la largeur le permet.
- Joker visible au-dessus des réponses, avec états disponible, chargement et utilisé.
- Le flux « Est-ce votre dernier mot ? » reste obligatoire avant verrouillage.

## Données

Une table `team_fifty_fifty_jokers` stocke partie, banc, question, deux choix conservés, utilisateur déclencheur et date. La clé `(game_id, challenge_id, team_id)` garantit une seule utilisation par banc et par épreuve.
