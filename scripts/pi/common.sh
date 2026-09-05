#!/usr/bin/env bash
set -Eeuo pipefail

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd -P)"
REPOSITORY_ROOT="$(cd -- "${SCRIPT_DIR}/../.." && pwd -P)"

cd "${REPOSITORY_ROOT}"

info() {
  printf '[fish] %s\n' "$*"
}

die() {
  printf '[fish] ERROR: %s\n' "$*" >&2
  exit 1
}

require_command() {
  command -v "$1" >/dev/null 2>&1 || die "Commande requise introuvable: $1"
}

require_docker() {
  require_command docker
  docker info >/dev/null 2>&1 || die "Docker ne répond pas. Lance ce script avec un utilisateur autorisé à utiliser Docker."
  docker compose version >/dev/null 2>&1 || die "Docker Compose v2 est requis."
}

app_container_id() {
  docker compose ps -q app 2>/dev/null || true
}

lan_ip() {
  local address=""

  if command -v hostname >/dev/null 2>&1; then
    address="$(hostname -I 2>/dev/null | awk '{print $1}' || true)"
  fi

  if [[ -z "${address}" ]] && command -v ipconfig >/dev/null 2>&1; then
    address="$(ipconfig getifaddr en0 2>/dev/null || true)"
  fi

  printf '%s' "${address:-127.0.0.1}"
}
