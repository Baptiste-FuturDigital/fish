# Portrait de Maude en béluga

## Objectif

Remplacer le portrait historique de Pauline utilisé par l'identité `maude` par un nouveau portrait de Maude en béluga, à partir de la photographie fournie par l'utilisateur.

## Direction visuelle

- Conserver le visage de Maude reconnaissable et ses traits naturels.
- Reprendre la composition carrée du portrait actuel : gros plan sous-marin lumineux, corps de béluga blanc entourant le visage, eau bleue et bulles.
- Conserver un rendu photoréaliste, ludique et cohérent avec les autres portraits du jeu.
- Ne générer ni texte, ni logo, ni watermark.

## Intégration

- Remplacer uniquement `assets/players/pauline-beluga.png` afin de préserver les références existantes et la compatibilité avec les parties persistées.
- Conserver un format carré adapté aux vignettes et agrandissements de la grille des joueurs.
- Ne supprimer ni ne modifier aucun autre asset.

## Validation et livraison

- Vérifier visuellement l'image finale avant intégration.
- Exécuter les tests pertinents et le build de production.
- Commit et push sur `main`, puis déployer sur le Raspberry Pi.
- Vérifier les réponses de santé LAN et publique ainsi que la présence du nouvel asset servi.
