# Question pour un poisson et Roue de Poséithon

## Objectif

Finaliser le contenu de « Question pour un poisson », accélérer sa vérification en démo et transformer l'interclassement qui suit « Le juste poisson » en récompense interactive pour le meilleur joueur. Le gagnant lance depuis son téléphone une roue synchronisée avec l'écran TV, dont l'issue scénarisée est toujours une sardine.

## Contenu de Question pour un poisson

Les cinq manches restent des manches à buzzer de 40 secondes, avec les scores internes `4, 3, 2, 1`, affichés comme `40, 30, 20, 10` points.

1. **Hippocampe** : contenu actuel inchangé.
2. **Poulpe** : contenu actuel inchangé. L'hémocyanine est la protéine riche en cuivre qui transporte l'oxygène chez de nombreux mollusques et donne au sang une couleur bleutée.
3. **Béluga** : seul le premier indice devient : « Je vis dans les eaux arctiques, je suis très sociable et je communique avec un répertoire impressionnant de sons. » Les trois autres indices restent inchangés.
4. **Crevette-mante** : le deuxième indice devient : « Mes bras frappent si vite qu'ils créent dans l'eau des bulles qui implosent avec un éclair et une seconde onde de choc. » Les autres indices restent inchangés.
5. **Kraken** : la tortue luth est remplacée par le Kraken et l'image existante `/teams/20-big-le-kraken.jpg` est réutilisée. Le Kraken relève du folklore scandinave, et non de la mythologie grecque. Les indices sont :
   - « Depuis des siècles, les marins racontent qu'une créature gigantesque se cacherait dans les profondeurs. »
   - « Je viens des légendes scandinaves et l'on me prête la force de faire sombrer des navires. »
   - « Mes immenses tentacules surgiraient de l'eau pour encercler les coques. »
   - « On me représente comme un calmar gigantesque : je suis le Kraken. »

Le fait révélé indique que la légende est aujourd'hui associée au calmar géant, sans présenter cette origine comme une certitude historique. La source est la fiche Kraken de l'American Museum of Natural History : `https://www.amnh.org/explore/ology/ology-cards/285-kraken`.

## Navigation accélérée en démo

La vue maître d'une partie de démonstration affiche un raccourci « Manche suivante » pendant une épreuve multimanque. Ce raccourci avance directement à la manche suivante sans attendre le chronomètre et sans passer par le reveal. Il est séparé du raccourci existant « Épreuve suivante », qui conserve sa fonction de saut vers l'épreuve suivante.

Le serveur fournit une commande dédiée et autoritaire :

- réservée au maître du jeu ;
- réservée aux parties de démonstration en cours ;
- refusée pendant la dernière manche ;
- réinitialise réponses, buzzer et chronomètre de la manche ;
- démarre immédiatement la manche suivante avec sa durée normale.

Cette commande évite le comportement fragile consistant à envoyer plusieurs commandes `advance` depuis le navigateur.

## Liste des invités

L'identité invitée « Pauline » est remplacée par « Maude » dans le sélecteur des joueurs. Son identifiant devient `maude`. L'image existante `pauline-beluga.png` et tous les autres médias sont conservés sans renommage ni suppression ; seule l'identité présentée dans l'application change. Une migration SQLite idempotente convertit également les éventuelles lignes existantes `identity_id='pauline'` vers `maude` et leur nom vers `Maude`, afin qu'une base conservée pendant le déploiement ne transforme pas cette identité en invitée anonyme.

## Déclenchement de la Roue de Poséithon

La roue est proposée uniquement sur le classement suivant la cinquième manche de « Le juste poisson ».

- Pour cet interclassement, le composant « Marée de Poséithon » devient « Roue de Poséithon ».
- Le bouton maître reste intitulé « Déchaîner la faveur ».
- Il ne donne pas le bonus de rattrapage `+20` au dernier banc.
- Il sélectionne le premier joueur du classement individuel affiché. Le tri existant reste la règle autoritaire ; en cas d'égalité, le joueur déjà affiché en tête gagne.
- Sur tous les autres interclassements, la Marée de Poséithon et son bonus de rattrapage restent inchangés.

Après déclenchement, seul le téléphone du gagnant affiche l'invitation « La faveur t'appelle » et le bouton « Déchaîner la roue ». Les autres joueurs voient un état d'attente non interactif. Le maître voit que la faveur a été remise au gagnant.

## Machine d'état persistante

Une table dédiée conserve une seule roue par partie et par interclassement :

- `offered` : le maître a désigné le gagnant ;
- `spinning` : le gagnant a lancé la roue, avec un `started_at` autoritaire ;
- `won` : l'animation est terminée et la sardine est gagnée.

La vue publique contient l'identité du gagnant, l'état, l'heure de départ et la durée d'animation, sans exposer ses jetons d'authentification. Les mutations sont transactionnelles et idempotentes.

Le lancement est refusé si l'appelant n'est pas le joueur gagnant. Un second lancement retourne l'état courant sans redémarrer la roue. La fin est dérivée de l'heure du serveur et persistée lors de la prochaine synchronisation, ce qui permet à un téléphone ou à la TV rechargés de reprendre au bon instant.

Le maître ne peut pas avancer vers l'épreuve suivante entre `offered` et la fin de `spinning`. Lorsque la roue est `won`, le bouton normal vers l'épreuve suivante redevient disponible.

## Expérience visuelle et sonore

La direction visuelle validée est « La Roue de Poséithon » : décor sous-marin nocturne, turquoise profond, jaune électrique, corail, violet et reflets lumineux. La TV montre une grande roue divisée en poissons variés ; le téléphone gagnant montre son portrait, son statut et le bouton de lancement.

La rotation dure environ six secondes : départ rapide, plusieurs tours, décélération nette puis arrêt sur la sardine. Le segment final est déterministe, mais l'animation doit conserver l'illusion d'un tirage.

L'animation de victoire comprend :

- flash doré ;
- confettis marins ;
- sardine qui bondit hors de la roue ;
- titre pulsant « Sardine légendaire remportée » ;
- fanfare finale.

Une musique originale locale de type jeu télévisé/chiptune accompagne la rotation. Elle ne dépend ni de Spotify, ni de YouTube, ni du réseau public. Elle démarre sur le téléphone gagnant à la suite de son geste utilisateur. L'écran TV tente la lecture synchronisée et reste visuellement complet si sa politique d'autoplay bloque le son.

Les animations respectent `prefers-reduced-motion` : l'état et le résultat restent explicites, avec une transition courte au lieu de la rotation complète. Les annonces importantes utilisent `aria-live`.

## Synchronisation

Le mécanisme de rafraîchissement déjà utilisé par le jeu reste le transport. L'état serveur et `started_at` rendent la TV et le téléphone cohérents malgré une latence de polling. Ajouter des WebSockets pour une animation unique de six secondes serait une complexité disproportionnée pour cette partie locale de vingt joueurs.

Chaque client calcule sa progression à partir de l'heure de départ reçue. Un client arrivant tard saute au bon point de l'animation au lieu de la recommencer.

## Composants

- Le service de jeu possède les transitions `offered → spinning → won` et les autorisations.
- La vue de tournoi expose un objet `sardineWheel` optionnel.
- Le classement choisit entre `PoseithonBonus` et `SardineWheelInvitation` selon l'épreuve.
- Le téléphone gagnant rend la commande de lancement.
- Le projecteur dispose d'une scène de roue prioritaire tant qu'elle est offerte, en rotation ou en victoire.
- Un module audio local encapsule la musique et la fanfare sans modifier les autres musiques du tournoi.

## Gestion des erreurs

- Aucun joueur éligible : le déclenchement échoue sans modifier l'état.
- Mauvais joueur ou jeton invalide : réponse `403`.
- Mauvaise phase, mauvaise épreuve ou vraie partie hors classement : réponse `409`.
- Double clic : opération idempotente ; aucune seconde roue n'est créée.
- Perte réseau pendant la rotation : la reconnexion recalcule la progression depuis `started_at`.
- Son bloqué : l'animation continue sans erreur et l'interface n'affiche pas de blocage.

## Validation

- Tests de contenu pour l'ordre Hippocampe, Poulpe, Béluga, Crevette-mante, Kraken, les indices et l'image Kraken.
- Test du catalogue d'identités : Maude est proposée, Pauline ne l'est plus et l'image béluga existante reste référencée.
- Tests service et API du saut de manche en démo, avec refus hors démo et en dernière manche.
- Tests service et API du déclenchement maître, du choix déterministe du gagnant, des autorisations joueur, de l'idempotence et du verrouillage de l'avance.
- Tests de projection publique pour l'absence de secrets et la reprise après rechargement.
- Tests composants des états maître, gagnant, autres joueurs, rotation et victoire.
- Test E2E mobile/TV : classement du Juste Poisson, faveur, lancement gagnant, roue synchronisée, sardine, animation de victoire puis passage à l'épreuve suivante.
- Build de production et suite complète avant déploiement.

## Déploiement

Le changement est fusionné sur `main`, poussé vers le dépôt distant puis déployé sur le Raspberry Pi avec sauvegarde préalable de la base SQLite. Après redémarrage, les endpoints de santé local et public, le bundle servi et le tunnel Cloudflare sont vérifiés. Aucun nom de domaine ni service externe supplémentaire n'est ajouté.
