#!/usr/bin/env bash
# Cold backup of the HA config dir (consistent SQLite), 14-day retention.
# Cron example (daily 03:30): 30 3 * * * /opt/nexushome/scripts/backup.sh >> /var/log/nexushome-backup.log 2>&1
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
DEST="${BACKUP_DIR:-$ROOT/backups}"
KEEP_DAYS="${KEEP_DAYS:-14}"
STAMP="$(date +%Y%m%d-%H%M%S)"

mkdir -p "$DEST"
cd "$ROOT"

# Always restart HA, even if tar fails
trap 'docker compose start homeassistant >/dev/null' EXIT
docker compose stop homeassistant >/dev/null

tar --exclude='config/home-assistant.log*' --exclude='config/tts' \
    -czf "$DEST/ha-config-$STAMP.tar.gz" config
chmod 600 "$DEST/ha-config-$STAMP.tar.gz"

find "$DEST" -name 'ha-config-*.tar.gz' -mtime +"$KEEP_DAYS" -delete
echo "[$(date -Is)] backup ok: ha-config-$STAMP.tar.gz"
# Off-site copy (encrypted!) is up to you, e.g.: rclone copy "$DEST" remote:nexushome-backups
