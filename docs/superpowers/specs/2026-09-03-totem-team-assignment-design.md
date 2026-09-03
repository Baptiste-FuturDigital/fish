# Attribution des animaux totems et des équipes

## Objectif

Attribuer aléatoirement un animal marin unique à chaque joueur avant le début de la partie. Les vingt images fournies forment quatre équipes équilibrées de cinq joueurs.

## Invariants serveur

- Une partie accepte au maximum vingt joueurs.
- Un joueur possède zéro ou un totem.
- Un totem ne peut appartenir qu'à un joueur dans une partie.
- L'attribution est atomique, aléatoire et idempotente.
- Les catégories techniques et numéros ne sont jamais exposés dans l'interface.
- La partie ne démarre que lorsque chaque joueur a révélé son totem.

SQLite stocke `totem_id` sur `players` et impose un index unique `(game_id, totem_id)`. Le serveur dérive le nom, l'image, le fun fact et l'équipe à partir d'un catalogue fermé de vingt entrées.

## Équipes

- `ugly` → Les Abyssaux
- `joli` → Les Coralliens
- `cool` → Les Électriques
- `big` → Les Colosses

Chaque catégorie contient cinq totems. La faute `ulgy` du fichier 4 est normalisée en `ugly` dans le catalogue.

## Parcours joueur

1. Le joueur crée ou rejoint une partie.
2. Le lobby lui demande de lancer le scan.
3. La caméra frontale est demandée, mais aucune image ni vidéo n'est capturée, stockée ou envoyée.
4. Si la caméra est refusée ou indisponible, une animation de scanner factice reste utilisable.
5. Le serveur réserve immédiatement un totem ; l'interface maintient le suspense pendant cinq secondes.
6. La révélation affiche uniquement l'image, « Votre animal totem est… », le nom, un fun fact et le nom d'équipe thématique.
7. Un rechargement conserve définitivement le même totem.

## Interface

- Carte de scan prioritaire au-dessus du code de lobby.
- Prévisualisation caméra dans un cadre arrondi avec ligne sonar animée et progression.
- Écran de révélation plein cadre, image `object-cover`, titre très lisible, fun fact court.
- Les joueurs déjà révélés affichent une miniature de leur animal dans la liste.
- Le bouton hôte explique quels joueurs doivent encore effectuer leur tirage.

## Performance

Les images affichées sont des dérivés JPEG de 1 200 px maximum, nommés sans catégorie (`totem-01.jpg` à `totem-20.jpg`). Une seule image de révélation est chargée par téléphone.

## Validation

- Tests unitaires : unicité, idempotence, limite de vingt joueurs et blocage du démarrage.
- Test API : jeton joueur obligatoire et attribution persistante.
- Test mobile : scan hôte et invité, révélation, miniatures, démarrage et fin de partie.
