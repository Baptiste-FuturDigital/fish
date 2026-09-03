# Fish Tournament — compétition individuelle et score des bancs

## Décision produit

Chaque poisson répond depuis son téléphone et possède un score individuel persistant. Le tournoi conserve deux compétitions parallèles : le classement personnel entretient la rivalité entre joueurs ; le classement des bancs désigne l'équipe victorieuse.

## Règles de score

- Tous les scores sont stockés en unités simples puis affichés multipliés par dix.
- Pour une manche numérique, tous les joueurs sont classés par écart relatif. Chacun marque selon sa précision. Pour chaque banc, seul son membre le plus précis porte le résultat collectif : les mauvaises estimations de ses coéquipiers ne le pénalisent pas.
- Pour une manche à choix, chaque bonne réponse rapporte les points au joueur. Un banc marque une seule fois les points de la manche si au moins un de ses membres répond correctement. Le nombre de joueurs du banc ne multiplie donc jamais le score collectif.
- Une réponse validée est personnelle, verrouillée et ne peut plus être modifiée.

## Classements

- Après chaque épreuve, un classement dense de tous les joueurs est affiché avec rang, totem, banc et score cumulé.
- Le tri est déterministe : score décroissant, puis nom français, puis identifiant.
- Après la dernière épreuve, le suspense et l'écran final restent centrés sur le classement des bancs afin de désigner les vainqueurs officiels.

## Bonus « Marée de Poséithon »

Pendant chaque inter-épreuve, l'hôte peut déclencher au maximum une faveur : `+20` points affichés au banc dernier. La cible est calculée par le serveur et ne peut pas être choisie arbitrairement. Cette règle crée un mécanisme de rattrapage visible sans permettre le harcèlement d'un banc ni rendre le classement illisible. Le bonus est persisté et idempotent.

## Audio

Chaque joueur entend le son YouTube `sj_8f94zsUs` uniquement lorsqu'il valide sa propre réponse. Le lecteur est préchargé hors écran et la lecture est déclenchée directement par le geste utilisateur pour respecter l'autoplay mobile. Choisir une option ou déplacer le curseur ne joue aucun son.

## Invariants

- Une réponse et un résultat au maximum par joueur et par manche.
- Un résultat collectif au maximum par banc et par manche.
- Le recalcul ou le polling ne peut jamais créditer deux fois un joueur, un banc ou un bonus.
- L'hôte reste hors compétition et n'émet pas le son de validation.
- SQLite demeure la source de vérité ; tous les téléphones convergent par polling.
