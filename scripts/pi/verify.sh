#!/usr/bin/env bash
set -Eeuo pipefail

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd -P)"
# shellcheck source=common.sh
source "${SCRIPT_DIR}/common.sh"

require_docker
require_command curl

container_id="$(app_container_id)"
[[ -n "${container_id}" ]] || die "Le conteneur Fish Tournament n'est pas démarré."

health=""
for _attempt in $(seq 1 30); do
  health="$(docker inspect --format '{{if .State.Health}}{{.State.Health.Status}}{{else}}{{.State.Status}}{{end}}' "${container_id}" 2>/dev/null || true)"
  if [[ "${health}" == "healthy" || "${health}" == "running" ]]; then
    break
  fi
  if [[ "${health}" == "unhealthy" || "${health}" == "exited" || "${health}" == "dead" ]]; then
    break
  fi
  sleep 2
done

if [[ "${health}" != "healthy" && "${health}" != "running" ]]; then
  docker compose logs --tail=100 app >&2 || true
  die "Le conteneur n'est pas sain (état: ${health:-inconnu})."
fi

health_response="$(curl --fail --silent --show-error --max-time 5 http://127.0.0.1:8787/api/health)" || {
  docker compose logs --tail=100 app >&2 || true
  die "L'API ne répond pas sur le port 8787."
}

[[ "${health_response}" == *'"status":"ok"'* ]] || die "Réponse de santé inattendue: ${health_response}"

for page_url in http://127.0.0.1:8787/ http://127.0.0.1:8787/tv; do
  if ! curl --fail --silent --show-error --max-time 5 "${page_url}" >/dev/null; then
    docker compose logs --tail=100 app >&2 || true
    die "La page ${page_url} ne répond pas."
  fi
done

address="$(lan_ip)"
if [[ "${address}" != "127.0.0.1" ]] && \
  ! curl --fail --silent --show-error --max-time 5 "http://${address}:8787/api/health" >/dev/null; then
  die "L'API répond en local mais pas sur l'interface LAN ${address}:8787."
fi

info "Application saine."
info "Maître du jeu / joueurs: http://${address}:8787/"
info "TV: http://${address}:8787/tv"
