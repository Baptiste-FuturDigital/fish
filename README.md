# Poisson Chelou

Jeu de soirée multijoueur mobile-first : un hôte crée un aquarium, les joueurs rejoignent avec un code à quatre caractères, puis le groupe enchaîne huit défis absurdes sur le thème de l'océan.

## Lancer en développement

```bash
npm install
npm run dev
```

- Application : `http://localhost:5179`
- API : `http://localhost:8787`

## Lancer comme en production

```bash
npm run build
npm start
```

L'application complète est alors disponible sur `http://localhost:8787`. Depuis un téléphone connecté au même Wi-Fi, remplacer `localhost` par l'adresse IP locale du Mac.

La base SQLite persistante est créée automatiquement dans `data/fish.db`.

## Vérification

```bash
npm test
npm run test:e2e
```

Le test navigateur ouvre deux sessions mobiles isolées et vérifie le parcours complet : création, arrivée d'un invité, démarrage, deux manches et fin de partie.
