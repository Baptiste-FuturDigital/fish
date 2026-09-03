# Musique d'ambiance sur l'accueil

## Objectif

Diffuser « Whale EDM » de Drewmin comme ambiance sonore de l'accueil Fish Party, avec un contrôle permanent permettant d'activer ou couper le son.

## Design retenu

- Utiliser le lecteur embarqué YouTube en mode confidentialité renforcée pour la vidéo `8g8Utx0gvv8`.
- Ne télécharger, convertir ou stocker aucun contenu audio dans le dépôt.
- Charger la piste en boucle et en mode muet afin de respecter les politiques d'autoplay des navigateurs.
- Au premier toucher ou clic sur l'accueil, lancer et démuter la piste. Un clic direct sur le contrôle audio produit le même résultat.
- Afficher en bas à droite un bouton circulaire shadcn avec une icône de volume.
- Fournir des libellés accessibles explicites : « Activer la musique » et « Couper la musique ».
- Conserver le lecteur pendant les écrans de choix, création et arrivée, puis l'arrêter automatiquement quand la partie commence et que l'accueil est démonté.
- Envoyer les commandes au lecteur avec l'IFrame Player API et un `origin` explicite.

## Contraintes

- L'autoplay sonore sans interaction est bloqué par les navigateurs modernes ; le premier geste utilisateur sert donc à autoriser le son.
- Le lecteur distant dépend de YouTube et d'une connexion Internet. Une piste locale sous licence serait nécessaire pour un fonctionnement hors ligne ou une maîtrise totale de la disponibilité.

## Validation

Le test mobile vérifie la présence du lecteur et du bouton, l'activation lors de la première interaction, le basculement muet/sonore et l'absence de régression sur le parcours multijoueur.

## Références

- Source : https://www.youtube.com/watch?v=8g8Utx0gvv8
- Paramètres officiels du lecteur : https://developers.google.com/youtube/player_parameters
