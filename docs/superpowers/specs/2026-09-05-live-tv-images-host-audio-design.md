# Correctif live — TV sans animaux et régie audio maître

## Incident

`Question pour un poisson` affiche l'animal cible sur la TV alors que seuls les indices doivent guider les joueurs. En parallèle, les lecteurs YouTube fragmentés tentent de démarrer hors geste utilisateur ; les navigateurs mobiles bloquent alors régulièrement le son.

## Décision

### TV

- Masquer entièrement le visuel de manche pendant `Question pour un poisson`, en réponse comme au reveal.
- Donner toute la largeur aux indices, au buzzer et aux résultats.
- Conserver les images dans les données et sur les téléphones au reveal ; aucun asset n'est supprimé.
- Ne pas modifier les autres jeux.

### Audio

- Le téléphone maître devient l'unique régie audio ; la TV reste visuelle pour éviter écho et désynchronisation.
- Remplacer les lecteurs automatiques dispersés par une régie persistante, repliable et tactile dans la vue maître.
- Exposer les pistes pertinentes selon la phase : ambiance, générique, musique de manche/chrono, effet de fin et suspense final.
- Utiliser un lecteur YouTube visible avec contrôles natifs. Le maître appuie lui-même sur lecture : ce geste satisfait les politiques autoplay iOS/Android et reflète l'état réel du lecteur.
- Garder l'URL publique Cloudflare comme origine de jeu ; une piste Millionnaire est indisponible depuis l'origine LAN mais fonctionne via HTTPS public.

## Alternatives écartées

- Relancer automatiquement les iframes : toujours fragile face aux politiques autoplay.
- Faire jouer la TV à distance : un geste sur le téléphone ne débloque pas l'audio du navigateur TV et créerait deux sorties concurrentes.
- Télécharger les pistes : plus fiable techniquement mais non faisable immédiatement sans fichiers audio licenciés.

## Validation

- Tests de rendu : aucune URL d'animal de `Question pour un poisson` sur la TV ; les autres jeux gardent leurs visuels.
- Tests de régie : visible uniquement pour le maître, liste de pistes correcte par phase, lecteur contrôlable manuellement.
- Suite Vitest, build, E2E critiques, déploiement Pi et santé LAN/public.
