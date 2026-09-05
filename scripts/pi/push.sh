#!/usr/bin/env bash
set -Eeuo pipefail

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd -P)"
# shellcheck source=common.sh
source "${SCRIPT_DIR}/common.sh"

require_command ssh
require_command rsync

[[ "$#" -eq 1 ]] || die "Usage: $0 utilisateur@adresse-du-pi"
target="$1"
[[ "${target}" =~ ^[A-Za-z0-9._-]+@[A-Za-z0-9._-]+$ ]] || \
  die "Cible SSH invalide: ${target}"

info "Préparation du répertoire distant sur ${target}..."
ssh "${target}" \
  'sudo install -d -o "$(id -un)" -g "$(id -gn)" /opt/fish-tournament'

info "Transfert de la version courante..."
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
  "${REPOSITORY_ROOT}/" "${target}:/opt/fish-tournament/"

info "Construction et démarrage sur le Raspberry Pi..."
ssh -t "${target}" \
  'cd /opt/fish-tournament && sudo ./scripts/pi/deploy.sh'
