#!/usr/bin/env bash
set -Eeuo pipefail

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd -P)"
# shellcheck source=common.sh
source "${SCRIPT_DIR}/common.sh"

require_docker

container_id="$(app_container_id)"
if [[ -z "${container_id}" ]]; then
  info "Aucun conteneur actif; aucune base à sauvegarder."
  exit 0
fi

timestamp="$(date -u +%Y%m%dT%H%M%SZ)"
container_backup="/app/data/.fish-backup-${timestamp}.db"
host_backup="${REPOSITORY_ROOT}/backups/fish-${timestamp}.db"

mkdir -p "${REPOSITORY_ROOT}/backups"

cleanup() {
  docker compose exec -T app rm -f "${container_backup}" >/dev/null 2>&1 || true
}
trap cleanup EXIT

info "Création d'une sauvegarde SQLite cohérente..."
docker compose exec -T \
  -e "BACKUP_PATH=${container_backup}" \
  app node --input-type=module <<'NODE'
import Database from "better-sqlite3"

const database = new Database(process.env.FISH_DB)
await database.backup(process.env.BACKUP_PATH)
database.close()
NODE

docker cp "${container_id}:${container_backup}" "${host_backup}" >/dev/null
[[ -s "${host_backup}" ]] || die "La sauvegarde créée est vide."

info "Sauvegarde: ${host_backup}"
