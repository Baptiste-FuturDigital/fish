# Prize Email Delivery Design

## Goal

À la fin d’un tournoi, permettre uniquement aux joueurs éligibles de saisir une adresse email et de recevoir leurs prix réels, sans exposer les fichiers des prix publiquement ni permettre un double envoi.

## Product flow

- Le maître du jeu et l’écran TV n’affichent aucun formulaire email.
- Le meilleur joueur voit une carte « Champion individuel » qui envoie un email Aquatis avec `best-player.jpeg`.
- Le dernier joueur voit une carte « Poisson pané » qui envoie un email humoristique avec `worst-player.jpeg`.
- Chaque membre du banc vainqueur voit une carte « Banc champion » qui envoie un email séparé contenant `team-win-certificate.jpeg` et `team-win-price.jpeg`.
- Un même joueur peut donc recevoir deux emails distincts et utiliser une adresse différente pour chacun.
- Après succès, la carte passe à l’état envoyé et ne déclenche plus d’envoi.

## Eligibility and ordering

- Le serveur recalcule l’éligibilité depuis l’état persistant d’une partie `finished`.
- Le meilleur joueur est le premier du classement individuel trié par score décroissant puis nom français croissant.
- Le dernier joueur est le dernier de ce même classement.
- Le banc vainqueur est le premier du classement des équipes trié par score décroissant puis nom français croissant.
- Une partie sans joueur éligible ne permet aucune réclamation.
- Le client ne peut jamais déclarer lui-même son rang ou son équipe gagnante.

## API and persistence

`POST /api/games/:code/prizes/:prizeType/claim`

Body:

```json
{
  "playerId": "uuid",
  "playerToken": "secret",
  "email": "player@example.com"
}
```

`prizeType` vaut `best-player`, `worst-player` ou `winning-team`.

La table `prize_claims` conserve une ligne par `(game_id, player_id, prize_type)` avec l’email, le statut `pending|sent|failed`, l’identifiant fournisseur, l’erreur technique et les timestamps. L’unicité rend les envois idempotents. Un envoi échoué peut être retenté ; un envoi réussi retourne le résultat existant sans contacter le fournisseur.

## Email provider

- Resend est appelé par HTTP avec `RESEND_API_KEY` et `FISH_EMAIL_FROM`.
- Le transport est injecté derrière une interface `PrizeEmailSender` afin que les tests utilisent un faux déterministe.
- Les emails sont HTML + texte et les JPEG sont joints en base64.
- Les erreurs du fournisseur ne sont pas exposées au client et l’adresse email n’est jamais loggée.
- Sans clé Resend, l’API répond `503` et l’interface explique que l’envoi n’est pas encore configuré.

## Asset security

Les quatre images quittent le répertoire Vite public `assets/` et sont stockées dans `private/prizes/`. Le runtime Docker copie ce dossier séparément. Aucune route statique ne dessert les récompenses.

## UI

Un composant `PrizeClaims` est rendu sous le classement final uniquement pour une session joueur. Il dérive les cartes potentielles depuis le classement visible, mais le serveur reste l’autorité. Chaque carte possède son formulaire indépendant, un champ email, des états attente/erreur/succès accessibles et une copie courte dans le ton Fish Tournament.

## Testing

- Tests DB de migration et d’unicité.
- Tests du service : authentification, partie non terminée, trois éligibilités, égalités déterministes, double envoi, retry après échec, pièces jointes exactes.
- Tests API : validation email, succès, refus et indisponibilité fournisseur.
- Tests React : visibilité selon session/rang, formulaires indépendants, succès et erreur.
- Build, suite Vitest, E2E final et vérification Docker.

## Operational constraints

- Un domaine expéditeur Resend vérifié est requis pour envoyer aux invités en production.
- Les réclamations contiennent des données personnelles ; la base SQLite et ses sauvegardes doivent rester privées.
- La table conserve le strict minimum opérationnel ; aucune adresse email n’est ajoutée à `GameView`.
