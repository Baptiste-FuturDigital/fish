# Le juste poisson — manches de 25 secondes

## Objectif

Passer la durée de chaque manche de l’épreuve 1, « Le juste poisson », de 20 à 25 secondes.

## Conception

- Modifier les cinq `durationSeconds` du catalogue `le-juste-poisson` à `25`.
- Aligner la règle d’introduction sur « 25 secondes par manche ».
- Conserver les autres épreuves, barèmes, curseurs et transitions inchangés.
- Le serveur reste la source de vérité : il calcule l’échéance à partir de la durée du catalogue, et les vues maître, joueur et projecteur consomment cette même valeur.

## Validation

- Mettre à jour le test du catalogue pour exiger cinq manches de 25 secondes et la règle correspondante.
- Observer l’échec du test avant la modification de production, puis sa réussite.
- Exécuter la suite complète et le build de production.
- Pousser `main`, déployer sur le Raspberry Pi et vérifier l’API ainsi que le bundle public.

## Déploiement et retour arrière

Utiliser le script de déploiement Raspberry Pi existant, qui sauvegarde SQLite et vérifie la santé du conteneur. Le retour arrière consiste à redéployer le commit précédent ; aucune migration de données n’est requise.
