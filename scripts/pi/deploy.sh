#!/usr/bin/env bash
set -Eeuo pipefail

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd -P)"
# shellcheck source=common.sh
source "${SCRIPT_DIR}/common.sh"

require_docker
docker compose config --quiet

rollback_available=false
current_container="$(app_container_id)"

if [[ -n "${current_container}" ]]; then
  "${SCRIPT_DIR}/backup.sh"
  current_image="$(docker inspect --format '{{.Image}}' "${current_container}")"
  docker image tag "${current_image}" fish-tournament:rollback
  rollback_available=true
fi

rollback() {
  if [[ "${rollback_available}" != true ]]; then
    die "Le nouveau service a échoué et aucune version précédente n'est disponible."
  fi

  info "Échec de validation; restauration de l'image précédente..."
  docker image tag fish-tournament:rollback fish-tournament:local
  docker compose up -d --no-deps --force-recreate app
  "${SCRIPT_DIR}/verify.sh"
  die "La nouvelle version a échoué; la version précédente a été restaurée."
}

info "Construction de l'image avant remplacement du service..."
docker compose build app

info "Démarrage de Fish Tournament..."
if ! docker compose up -d --no-deps --remove-orphans app; then
  rollback
fi

if ! "${SCRIPT_DIR}/verify.sh"; then
  rollback
fi

info "Déploiement terminé."
