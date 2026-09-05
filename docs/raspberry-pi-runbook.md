# Déploiement Raspberry Pi — guide de soirée

Ce guide déploie Fish Tournament sur un Raspberry Pi 5 en réseau local. Il n'utilise ni domaine, ni HTTPS, ni reverse proxy, ni exposition Internet. La TV et les téléphones doivent être connectés au même réseau que le Pi.

## Architecture et adresses

```text
TV + téléphones des joueurs
          |
    Wi-Fi domestique
          |
Raspberry Pi 5 (Ethernet recommandé)
          |
Docker Compose -> application + SQLite
```

Les URL sont :

- jeu et interface maître : `http://<IP_DU_PI>:8787/` ;
- écran TV : `http://<IP_DU_PI>:8787/tv` ;
- état du service : `http://<IP_DU_PI>:8787/api/health`.

La TV doit impérativement ouvrir `/tv` avec l'adresse IP du Pi, jamais avec `localhost`. Le QR code reprend l'origine de cette page ; les téléphones pourront ainsi atteindre la bonne adresse.

## 1. Préparer le Raspberry Pi

Dans Raspberry Pi Imager, installer **Raspberry Pi OS Lite 64-bit**, définir un utilisateur, activer SSH et ajouter une clé publique. Brancher ensuite le Pi en Ethernet au routeur si possible.

Depuis le poste de développement :

```bash
ssh <UTILISATEUR>@<IP_DU_PI>
```

Sur le Pi :

```bash
sudo apt update
sudo apt full-upgrade -y
sudo reboot
```

Après reconnexion, confirmer l'architecture 64 bits :

```bash
dpkg --print-architecture
```

Le résultat attendu est `arm64`. Créer ensuite une réservation DHCP dans le routeur afin que l'adresse du Pi ne change pas pendant la soirée.

## 2. Installer Docker depuis le dépôt officiel

Sur Raspberry Pi OS 64 bits, utiliser les paquets Debian `arm64` officiels :

```bash
sudo apt update
sudo apt install -y ca-certificates curl rsync
sudo install -m 0755 -d /etc/apt/keyrings
sudo curl -fsSL https://download.docker.com/linux/debian/gpg \
  -o /etc/apt/keyrings/docker.asc
sudo chmod a+r /etc/apt/keyrings/docker.asc

sudo tee /etc/apt/sources.list.d/docker.sources >/dev/null <<EOF
Types: deb
URIs: https://download.docker.com/linux/debian
Suites: $(. /etc/os-release && echo "$VERSION_CODENAME")
Components: stable
Architectures: $(dpkg --print-architecture)
Signed-By: /etc/apt/keyrings/docker.asc
EOF

sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io \
  docker-buildx-plugin docker-compose-plugin
sudo systemctl enable --now docker
sudo docker version
sudo docker compose version
```

Référence : [installation officielle de Docker Engine sur Debian](https://docs.docker.com/engine/install/debian/).

Les commandes de ce guide gardent `sudo` devant Docker. Ajouter l'utilisateur au groupe `docker` est inutile et lui donnerait de fait des privilèges root.

## 3. Transférer l'application

Le chemin rapide depuis la racine du dépôt transfère puis déploie directement :

```bash
./scripts/pi/push.sh <UTILISATEUR>@<IP_DU_PI>
```

Les étapes suivantes détaillent ce que fait cette commande et restent utiles pour le diagnostic.

Sur le Pi, créer le répertoire de déploiement :

```bash
sudo install -d -o "$(id -un)" -g "$(id -gn)" /opt/fish-tournament
```

Depuis la racine du dépôt sur le poste de développement, définir la cible puis synchroniser les sources :

```bash
PI_TARGET=<UTILISATEUR>@<IP_DU_PI>

rsync -az --delete \
  --exclude='.git/' \
  --exclude='.env' \
  --exclude='node_modules/' \
  --exclude='dist/' \
  --exclude='data/' \
  --exclude='backups/' \
  --exclude='output/' \
  --exclude='tmp/' \
  --exclude='test-results/' \
  --exclude='playwright-report/' \
  ./ "$PI_TARGET:/opt/fish-tournament/"
```

`--delete` maintient une copie fidèle du dépôt dans ce répertoire dédié. Ne remplace pas `/opt/fish-tournament` par un répertoire contenant d'autres données.

## 4. Déployer

Depuis le poste de développement :

```bash
ssh "$PI_TARGET" \
  'cd /opt/fish-tournament && sudo ./scripts/pi/deploy.sh'
```

Le script valide la configuration, construit l'image ARM64 avant de remplacer la version active, sauvegarde une base existante et attend que le conteneur soit sain.

Pour relancer directement depuis le Pi :

```bash
cd /opt/fish-tournament
sudo ./scripts/pi/deploy.sh
```

## 5. Vérifier avant la soirée

Sur le Pi :

```bash
cd /opt/fish-tournament
sudo ./scripts/pi/verify.sh
sudo docker compose ps
curl --fail http://127.0.0.1:8787/api/health
```

Depuis un autre appareil du réseau, ouvrir `http://<IP_DU_PI>:8787/`. Puis :

1. ouvrir `http://<IP_DU_PI>:8787/tv` sur la TV ;
2. créer une partie ;
3. scanner le QR code avec au moins un téléphone sur le même Wi-Fi ;
4. rejoindre et soumettre une réponse de test.

Ne pas utiliser un réseau invité : de nombreux routeurs isolent ses clients et empêchent les téléphones de joindre le Pi. Maintenir toute redirection de port du routeur désactivée ; le port `8787` ne doit être accessible que depuis le LAN.

Créer et piloter la partie depuis une fenêtre normale, pas depuis la navigation privée : le jeton du maître du jeu est conservé dans le stockage local du navigateur.

Le cœur du quiz fonctionne sans Internet. Les pistes audio chargées depuis YouTube et l'envoi optionnel des récompenses par e-mail nécessitent en revanche une connexion Internet ; leur absence ne bloque pas la partie.

La caméra du navigateur peut être bloquée sur cette URL HTTP. Le fallback visuel prévu par l'application est alors utilisé ; le quiz reste fonctionnel.

## 6. Exploitation

État et vérification :

```bash
cd /opt/fish-tournament
sudo docker compose ps
sudo ./scripts/pi/verify.sh
```

Logs en direct :

```bash
sudo docker compose logs --tail=200 -f app
```

Sauvegarde cohérente de SQLite :

```bash
sudo ./scripts/pi/backup.sh
```

Le script affiche le chemin absolu du fichier créé dans `backups/`. Cette sauvegarde reste sur le Pi ; copier manuellement le fichier indiqué vers un autre support si sa conservation après la soirée est importante.

Restaurer explicitement une sauvegarde :

```bash
sudo ./scripts/pi/restore.sh /opt/fish-tournament/backups/<SAUVEGARDE>.db
```

La restauration remplace la base courante. Vérifier soigneusement le chemin avant d'exécuter cette commande.

## 7. Vérifier le redémarrage automatique

Faire ce test avant l'arrivée des joueurs :

```bash
sudo reboot
```

Après la reconnexion SSH :

```bash
cd /opt/fish-tournament
sudo ./scripts/pi/verify.sh
```

Le conteneur doit revenir automatiquement grâce à `restart: unless-stopped`.

## 8. Arrêter proprement après la soirée

Créer une dernière sauvegarde puis éteindre le Pi :

```bash
cd /opt/fish-tournament
sudo ./scripts/pi/backup.sh
sudo shutdown -h now
```

Attendre l'arrêt complet avant de débrancher l'alimentation. Ne jamais exécuter `docker compose down --volumes` : cette option supprime le volume `fish-data` et donc la base SQLite.

## Diagnostic rapide

Afficher l'adresse actuelle du Pi :

```bash
hostname -I
```

Si la page fonctionne sur le Pi mais pas sur un téléphone :

- vérifier que le téléphone et le Pi sont sur le même réseau non invité ;
- vérifier que la TV utilise bien `http://<IP_DU_PI>:8787/tv` ;
- vérifier le service avec `sudo ./scripts/pi/verify.sh` ;
- si UFW a été activé manuellement, autoriser le port avec `sudo ufw allow 8787/tcp` ;
- consulter `sudo docker compose logs --tail=200 app`.

Si un nouveau déploiement échoue, `deploy.sh` conserve le service actif tant que la nouvelle image n'est pas construite. En cas d'échec après remplacement, il tente automatiquement de revenir à l'image précédente.
