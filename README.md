# Fish Tournament

Jeu de soirée multijoueur mobile-first : un maître du jeu crée un aquarium hors compétition, les joueurs rejoignent avec un code à quatre caractères, reçoivent un totem et enchaînent quatre épreuves océaniques.

Chaque joueur répond sur son téléphone et cumule un score personnel. Pour les estimations numériques, le meilleur joueur de chaque banc porte le score collectif ; pour les QCM, le banc marque une seule fois si au moins un membre répond juste. Dans « Qui veut gagner des poissons ? », chaque banc partage un unique joker 50/50 pour toute l'épreuve. Le classement individuel apparaît entre les épreuves et le classement final sacre le banc vainqueur. L'hôte peut déclencher une « Marée de Poséithon » par intermission pour donner 20 points au banc dernier.

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

## Lancer avec Docker

Pour activer l’envoi des récompenses, copier `.env.example` vers `.env`, puis renseigner :

- `RESEND_API_KEY` : clé API Resend ;
- `FISH_EMAIL_FROM` : expéditeur utilisant un domaine vérifié dans Resend, par exemple `Fish Tournament <prix@votre-domaine.fr>`.

Sans ces variables, le jeu reste utilisable mais l’envoi des récompenses est indisponible. Le dossier `private/prizes` est inclus dans l’image Docker sans être servi par le serveur HTTP.

```bash
docker compose up --build -d
```

Ouvrir ensuite [http://localhost:8787](http://localhost:8787). La base SQLite est conservée dans le volume nommé `fish-data`.

```bash
docker compose logs -f app
docker compose down
```

`docker compose down` arrête l'application sans supprimer les parties. Ajouter `--volumes` uniquement pour supprimer volontairement la base persistante.

## Déployer sur Raspberry Pi (réseau local)

Pour une soirée, déployer l'application sans domaine ni HTTPS sur un Raspberry Pi 5 relié au réseau domestique :

```bash
./scripts/pi/push.sh <UTILISATEUR>@<IP_DU_PI>
```

Ouvrir ensuite `http://<IP_DU_PI>:8787/`. La TV doit utiliser `http://<IP_DU_PI>:8787/tv` — et non `localhost` — afin que le QR code pointe vers une adresse accessible aux téléphones connectés au même Wi-Fi. Garder toute redirection de port du routeur désactivée.

Installation du Pi, transfert `rsync`, vérification, logs, sauvegarde, restauration et arrêt : [guide de déploiement Raspberry Pi](docs/raspberry-pi-runbook.md).

## Vérification

```bash
npm test
npm run test:e2e
```

Le parcours navigateur ouvre un hôte et quatre téléphones isolés : création, totems, réponses individuelles, score, classement joueurs, bonus et classement final des bancs.
