#!/usr/bin/env bash
set -Eeuo pipefail

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd -P)"
# shellcheck source=common.sh
source "${SCRIPT_DIR}/common.sh"

require_docker

[[ "$#" -eq 1 ]] || die "Usage: $0 /chemin/vers/fish-YYYYMMDDTHHMMSSZ.db"
[[ "$1" == *.db ]] || die "La sauvegarde doit être un fichier .db."
[[ -f "$1" && -s "$1" ]] || die "Sauvegarde introuvable ou vide: $1"

backup_directory="$(cd -- "$(dirname -- "$1")" && pwd -P)"
backup_path="${backup_directory}/$(basename -- "$1")"

info "Validation de la sauvegarde SQLite..."
docker compose run --rm --no-deps \
  --volume "${backup_path}:/tmp/fish-restore.db:ro" \
  app node --input-type=module <<'NODE'
import Database from "better-sqlite3"

const database = new Database("/tmp/fish-restore.db", {
  readonly: true,
  fileMustExist: true,
})
const result = database.pragma("quick_check")
database.close()

if (result.length !== 1 || result[0].quick_check !== "ok") {
  console.error("La sauvegarde SQLite est corrompue.")
  process.exit(1)
}
NODE

current_container="$(app_container_id)"
service_stopped=false

restart_after_failure() {
  local exit_code="$?"
  if [[ "${service_stopped}" == true ]]; then
    info "La restauration a échoué; redémarrage du service précédent..."
    docker compose up -d --no-deps app >/dev/null 2>&1 || true
  fi
  exit "${exit_code}"
}
trap restart_after_failure EXIT

if [[ -n "${current_container}" ]]; then
  "${SCRIPT_DIR}/backup.sh"
  docker compose stop app
  service_stopped=true
fi

info "Restauration de ${backup_path}..."
docker compose run --rm --no-deps \
  --volume "${backup_path}:/tmp/fish-restore.db:ro" \
  app sh -eu -c '
    rm -f /app/data/fish.db /app/data/fish.db-wal /app/data/fish.db-shm
    cp /tmp/fish-restore.db /app/data/fish.db
  '

docker compose up -d --no-deps app
service_stopped=false
"${SCRIPT_DIR}/verify.sh"
trap - EXIT
info "Restauration terminée."
