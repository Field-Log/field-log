#!/usr/bin/env bash
# Refresh one site's catalog and publish its data + images.
#
# Orchestrates, for the site dir passed as $1:
#   1. back up data/archive.json  (recovery point if the fetch corrupts it)
#   2. fetch + merge + build       (core/shopify_archive.py → data/data.json)
#   3. append-only safeguard       (refuse to publish if the product count dropped)
#   4. publish data.json + images  (rsync to a remote host, or copy into a local
#                                   web root — chosen by config.toml [deploy] mode)
#
# Usage:  core/deploy.sh <site_dir>          e.g.  core/deploy.sh sites/autmog
#
# All site-specific behaviour (source URL, deploy target) lives in
# <site_dir>/config.toml. There are NO secrets in this file.
#
# Failure signalling is delegated to cron — this script exits non-zero on any
# error (set -euo pipefail), so a crontab `MAILTO=` plus a `|| tail -n 80 …`
# guard mails the log tail on failure only. See README.md ("Scheduling").
set -euo pipefail

CORE_DIR="$(cd "$(dirname "$0")" && pwd)"
ENGINE="$CORE_DIR/shopify_archive.py"

SITE_DIR="${1:?usage: deploy.sh <site_dir>}"
SITE_DIR="$(cd "$SITE_DIR" && pwd)"
DATA_DIR="$SITE_DIR/data"
CONFIG="$SITE_DIR/config.toml"
[ -f "$CONFIG" ] || { echo "no config.toml in $SITE_DIR" >&2; exit 1; }

# Read a dotted key out of config.toml (stdlib tomllib; missing key → empty string).
read_cfg() {
  python3 - "$CONFIG" "$1" <<'PY'
import sys, tomllib
cfg = tomllib.load(open(sys.argv[1], "rb"))
val = cfg
for k in sys.argv[2].split("."):
    val = val.get(k) if isinstance(val, dict) else None
print("" if val is None else val)
PY
}

LABEL="$(read_cfg label)";            LABEL="${LABEL:-$(basename "$SITE_DIR")}"
MODE="$(read_cfg deploy.mode)"
SUBDIR="$(read_cfg deploy.subdir)"
REMOTE_HOST="$(read_cfg deploy.remote_host)"
REMOTE_ROOT="$(read_cfg deploy.remote_root)"
LOCAL_ROOT="$(read_cfg deploy.local_root)"

log() { printf '[%(%Y-%m-%d %H:%M:%S)T] %s\n' -1 "$*"; }

# --- Safeguard 1 — back up archive.json BEFORE fetching --------------------
if [ -f "$DATA_DIR/archive.json" ]; then
  cp "$DATA_DIR/archive.json" "$DATA_DIR/archive.json.bak"
  log "[$LABEL] backed up archive.json → archive.json.bak"
fi

# --- Fetch + merge + build -------------------------------------------------
log "[$LABEL] fetch + build (archive.json → data.json, downloads new images)"
python3 "$ENGINE" "$SITE_DIR"

# --- Safeguard 2 — archive is append-only ----------------------------------
# If the freshly-built data.json has FEWER products than the pre-run archive,
# something is corrupt; refuse to publish and keep last-known-good in the .bak.
if [ -f "$DATA_DIR/data.json" ] && [ -f "$DATA_DIR/archive.json.bak" ]; then
  COUNT=$(python3 -c "import json;print(len(json.load(open('$DATA_DIR/data.json'))['products']))" 2>/dev/null || echo 0)
  PREV=$(python3 -c "import json;print(len(json.load(open('$DATA_DIR/archive.json.bak'))['products']))" 2>/dev/null || echo 0)
  if [ "$COUNT" -lt "$PREV" ]; then
    log "[$LABEL] ABORT: data.json has $COUNT products vs $PREV before this run — archive should be append-only; refusing to publish. Last-good preserved in archive.json.bak."
    exit 2
  fi
  log "[$LABEL] sanity check passed: $COUNT products (>= $PREV previous)"
fi

# Files to publish: always data.json; index.html only if this site ships its own
# page from here. (The front-end is normally deployed separately from apps/.)
SHELL_FILES=("$DATA_DIR/data.json")
[ -f "$SITE_DIR/index.html" ] && SHELL_FILES+=("$SITE_DIR/index.html")

# --- Publish ---------------------------------------------------------------
# Safeguard 3 — images are ADD-ONLY everywhere: the live target owns each image
# once uploaded. --ignore-existing skips files already there; we never overwrite
# or delete, so local corruption cannot propagate to the live site.
case "$MODE" in
  remote)
    dest="$REMOTE_ROOT${SUBDIR:+/$SUBDIR}"
    log "[$LABEL] ensure remote dirs exist on $REMOTE_HOST"
    ssh "$REMOTE_HOST" "mkdir -p $dest/images"
    log "[$LABEL] rsync data → $REMOTE_HOST:$dest/"
    rsync -av --no-perms --no-times --checksum "${SHELL_FILES[@]}" "$REMOTE_HOST:$dest/"
    log "[$LABEL] rsync images → $dest/images/ (ADD-ONLY)"
    rsync -av --no-perms --no-times --ignore-existing "$DATA_DIR/images/" "$REMOTE_HOST:$dest/images/"
    ;;
  local)
    dest="$LOCAL_ROOT${SUBDIR:+/$SUBDIR}"
    [ -n "$LOCAL_ROOT" ] || { log "[$LABEL] ERROR: deploy.mode=local but deploy.local_root is empty"; exit 3; }
    mkdir -p "$dest/images"
    log "[$LABEL] copy data → $dest/"
    rsync -a --checksum "${SHELL_FILES[@]}" "$dest/"
    log "[$LABEL] copy images → $dest/images/ (ADD-ONLY)"
    rsync -a --ignore-existing "$DATA_DIR/images/" "$dest/images/"
    ;;
  *)
    log "[$LABEL] ERROR: unknown deploy.mode '$MODE' (expected: remote | local)"
    exit 3
    ;;
esac

log "[$LABEL] done."
