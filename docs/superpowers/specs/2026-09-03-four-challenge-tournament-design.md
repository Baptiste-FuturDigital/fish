# Fish Tournament — tournoi à quatre épreuves

## Objectif

Transformer le prototype en jeu de soirée complet : chaque joueur rejoint depuis son téléphone, reçoit un totem unique, retrouve son banc, choisit son nom d’équipe et joue quatre épreuves consécutives. L’hôte cadence toute la soirée depuis son téléphone.

## Parcours

1. L’hôte crée l’aquarium et partage le code.
2. Chaque joueur rejoint, lance le faux scan de cinq secondes et reçoit un totem unique.
3. L’attribution équilibre les quatre catégories : l’écart entre les bancs ne dépasse jamais une personne. Avec vingt joueurs, chaque banc contient exactement cinq personnes.
4. Le lobby affiche les quatre bancs et leurs membres. N’importe quel membre peut proposer ou modifier le nom de son banc avant le départ.
5. L’hôte démarre. Chaque épreuve suit `intro → réponses chronométrées → révélation et score`.
6. Après la dernière révélation, l’application affiche le classement final et le banc victorieux.

## Modèle multijoueur

- SQLite est la source de vérité pour la phase, le timer, les réponses et les scores.
- Un banc dépose une réponse commune. Tous ses membres voient la sélection en direct ; n’importe lequel peut la modifier jusqu’à validation. Une réponse validée est verrouillée.
- Le serveur authentifie chaque écriture avec le jeton joueur. Les commandes de rythme utilisent le jeton hôte.
- Le polling existant passe à une seconde pendant une partie.
- Le timer est calculé depuis une échéance serveur. À expiration, le premier rafraîchissement effectue une transition idempotente vers la révélation et calcule les scores.
- L’hôte peut démarrer une manche, révéler immédiatement, avancer et terminer la partie.

## Équipes

- Les catégories internes restent `ugly`, `joli`, `cool`, `big`, sans être montrées aux joueurs.
- Noms initiaux : Les Abyssaux, Les Coralliens, Les Électriques, Les Colosses.
- L’algorithme choisit d’abord une catégorie parmi les moins remplies, puis un totem disponible au hasard dans cette catégorie.
- Chaque totem reste unique dans une partie.

## Épreuves

### 1. Le juste poisson

- Trois poissons, trois estimations en kilogrammes, vingt secondes par estimation.
- Le classement utilise l’écart relatif afin de comparer équitablement des animaux de tailles différentes.
- Barème par manche : 4, 3, 2 et 1 points du plus proche au plus éloigné. Une absence de réponse vaut zéro.
- La révélation montre le poids, l’écart de chaque banc et un fait étonnant.

### 2. Question pour un poisson

- Dix questions difficiles, surprenantes et pédagogiques, quatre choix, vingt secondes.
- Deux points par bonne réponse.
- La révélation explique la réponse en une phrase courte.

### 3. Who's that salmon ?

- Cinq animaux marins apparaissent en silhouette noire avec quatre propositions.
- Vingt secondes, puis révélation de l’image originale et d’un fun fact.
- Deux points par bonne réponse.

### 4. Qui veut gagner des poissons ?

- Cinq questions A/B/C/D à difficulté et valeur croissantes : 100, 200, 300, 500 et 1 000 points.
- Trente secondes. Après une sélection, le banc confirme avec « C’est notre dernier mot ».
- Georges Clownez présente l’épreuve avec `public/goerge-clownez-fun.png`.
- Générique dédié : vidéo YouTube `doSjY-DGmjY`. Le thème Game Show `UaRrDZWhtWA` sert de repli.

## Audio et rythme

- Chaque écran d’introduction tente de lancer son générique. Le bouton son reste disponible à cause des restrictions d’autoplay mobile.
- « Question pour un poisson » utilise `Zcl98Bguq7k`.
- Les autres épreuves utilisent le thème Game Show par défaut `UaRrDZWhtWA`.
- La musique d’accueil existante reste l’ambiance par défaut hors épreuve.

## Interface

- Mobile-first, une action principale par écran, timer très visible et statut de réponse de chaque banc.
- L’hôte dispose d’une barre de commandes collante en bas.
- Les joueurs voient uniquement les contrôles autorisés à leur banc.
- Le classement reste visible entre les manches sans voler l’attention à la consigne.
- Les phases loading, réponse verrouillée, temps écoulé et erreur réseau sont explicites.

## Validation

- Tests unitaires : équilibrage, unicité, verrouillage, expiration idempotente, calcul des quatre barèmes, progression complète.
- Tests API : renommage d’un banc, réponse authentifiée, commandes hôte.
- Playwright mobile multi-contexte : quatre joueurs, quatre bancs, renommage, une réponse par type, enchaînement jusqu’au classement final.
- Build TypeScript, contrôle console, Docker et healthcheck.
