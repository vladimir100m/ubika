#!/usr/bin/env bash
set -euo pipefail

# Safe migration runner for local/CI use.
# Usage:
#   ./scripts/run_migrations.sh --list       # list migration files
#   ./scripts/run_migrations.sh --apply      # apply migrations (requires psql + DATABASE_URL)
#   ./scripts/run_migrations.sh --help

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
MIGRATIONS_DIR="$ROOT_DIR/migrations"

function usage() {
  echo "Usage: $0 [--list|--apply|--help]"
  exit 1
}

if [[ ${#@} -eq 0 ]]; then
  usage
fi

while [[ $# -gt 0 ]]; do
  case $1 in
    --list)
      echo "Migration files in $MIGRATIONS_DIR:";
      ls -1 "$MIGRATIONS_DIR"/*.sql 2>/dev/null || echo "(none)";
      exit 0
      ;;
    --apply)
      # Apply all SQL files in alphanumeric order
      if ! command -v psql >/dev/null 2>&1; then
        echo "psql not found in PATH. Please install psql or run migrations manually." >&2
        exit 2
      fi
      if [[ -z "${DATABASE_URL:-}" ]]; then
        echo "DATABASE_URL is not set. Set it in the environment before running migrations." >&2
        exit 3
      fi

      echo "Applying migrations from $MIGRATIONS_DIR"
      for f in $(ls -1 "$MIGRATIONS_DIR"/*.sql | sort); do
        echo "---- applying: $f"
        psql "$DATABASE_URL" -f "$f"
      done
      echo "All migrations applied."
      exit 0
      ;;
    --help)
      usage
      ;;
    *)
      usage
      ;;
  esac
done
