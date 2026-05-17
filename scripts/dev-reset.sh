#!/usr/bin/env bash
# Reset the local environment to "fresh user just discovered the plugin" state.
# Use between install/onboarding tests so /tmp caches and prior plugin state
# don't produce false-positive successes.
#
# Idempotent. Safe to re-run. Reports state changes; only modifies things this
# plugin owns. Does NOT touch the upstream MCP fork or the workspace source.
#
# Usage:
#   ./scripts/dev-reset.sh           # interactive, confirms before destructive ops
#   ./scripts/dev-reset.sh --yes     # non-interactive (CI / repeated dev)
#   ./scripts/dev-reset.sh --dry-run # report only, change nothing

set -euo pipefail

YES=0
DRY=0
for arg in "$@"; do
  case "$arg" in
    --yes|-y) YES=1 ;;
    --dry-run|-n) DRY=1 ;;
    --help|-h) sed -n '2,16p' "$0"; exit 0 ;;
    *) echo "unknown arg: $arg" >&2; exit 2 ;;
  esac
done

CLAUDE_PLUGINS="$HOME/.claude/plugins"
PLUGIN_NAME="spotify-set-reorder"

# Targets — paths and JSON keys we'll touch. Listing here so the dry-run can
# show them clearly without doing anything.
declare -a FILE_TARGETS=(
  "/tmp/enriched.json"
  "$CLAUDE_PLUGINS/cache/$PLUGIN_NAME"
  "$CLAUDE_PLUGINS/data/$PLUGIN_NAME"
  "$CLAUDE_PLUGINS/marketplaces/$PLUGIN_NAME"
)

# Glob target evaluated separately (won't expand inside the array if empty).
BACKUP_GLOB="/tmp/spotify-reorder-backup-*.json"

# JSON edits: remove the plugin's entries if present.
INSTALLED_JSON="$CLAUDE_PLUGINS/installed_plugins.json"
MARKETPLACES_JSON="$CLAUDE_PLUGINS/known_marketplaces.json"

echo "=== plugin state to reset ==="
for t in "${FILE_TARGETS[@]}"; do
  if [ -e "$t" ] || [ -L "$t" ]; then
    echo "  WILL REMOVE  $t"
  else
    echo "  (absent)     $t"
  fi
done

# Backup files via glob.
backups=( $BACKUP_GLOB )
if [ -e "${backups[0]:-}" ]; then
  for b in "${backups[@]}"; do echo "  WILL REMOVE  $b"; done
else
  echo "  (absent)     $BACKUP_GLOB"
fi

# JSON entries — query without modifying.
echo ""
echo "=== json registrations to clean ==="
if [ -f "$INSTALLED_JSON" ]; then
  python3 - "$INSTALLED_JSON" "$PLUGIN_NAME" <<'PY'
import json, sys
path, name = sys.argv[1], sys.argv[2]
d = json.load(open(path))
keys = [k for k in d.get("plugins", {}).keys() if name in k]
if keys: print(f"  WILL REMOVE entries from installed_plugins.json: {keys}")
else:    print(f"  (absent)     no {name} entries in installed_plugins.json")
PY
fi
if [ -f "$MARKETPLACES_JSON" ]; then
  python3 - "$MARKETPLACES_JSON" "$PLUGIN_NAME" <<'PY'
import json, sys
path, name = sys.argv[1], sys.argv[2]
d = json.load(open(path))
keys = [k for k in d.keys() if name in k]
if keys: print(f"  WILL REMOVE entries from known_marketplaces.json: {keys}")
else:    print(f"  (absent)     no {name} entries in known_marketplaces.json")
PY
fi

# Reportonly checks — don't touch, just warn. These often hide stale state
# in dev environments but the dev probably wants to handle them by hand.
echo ""
echo "=== reportonly (NOT modified by this script) ==="
if [ -L "$HOME/.claude/skills/$PLUGIN_NAME" ] || [ -e "$HOME/.claude/skills/$PLUGIN_NAME" ]; then
  echo "  WARNING  $HOME/.claude/skills/$PLUGIN_NAME exists (likely dev symlink — remove manually if it shadows the plugin during tests)"
fi
if python3 -c "
import json, os, sys
d = json.load(open(os.path.expanduser('~/.claude.json')))
if 'spotify' in d.get('mcpServers', {}): sys.exit(0)
sys.exit(1)" 2>/dev/null; then
  echo "  WARNING  ~/.claude.json has an mcpServers.spotify entry — remove with: claude mcp remove spotify"
fi

if [ "$DRY" -eq 1 ]; then
  echo ""
  echo "[dry-run] no changes made."
  exit 0
fi

if [ "$YES" -ne 1 ]; then
  echo ""
  read -p "Proceed with cleanup? [y/N] " ans
  [[ "$ans" =~ ^[yY]$ ]] || { echo "aborted."; exit 1; }
fi

echo ""
echo "=== applying ==="
for t in "${FILE_TARGETS[@]}"; do
  if [ -e "$t" ] || [ -L "$t" ]; then
    rm -rf "$t" && echo "  removed   $t"
  fi
done

# Re-glob in case the directory state changed between report and apply.
backups=( $BACKUP_GLOB )
if [ -e "${backups[0]:-}" ]; then
  for b in "${backups[@]}"; do rm -f "$b" && echo "  removed   $b"; done
fi

if [ -f "$INSTALLED_JSON" ]; then
  python3 - "$INSTALLED_JSON" "$PLUGIN_NAME" <<'PY'
import json, sys
path, name = sys.argv[1], sys.argv[2]
d = json.load(open(path))
plugins = d.get("plugins", {})
to_remove = [k for k in plugins if name in k]
for k in to_remove: del plugins[k]
if to_remove:
    json.dump(d, open(path, 'w'), indent=2)
    print(f"  pruned    installed_plugins.json: {to_remove}")
PY
fi
if [ -f "$MARKETPLACES_JSON" ]; then
  python3 - "$MARKETPLACES_JSON" "$PLUGIN_NAME" <<'PY'
import json, sys
path, name = sys.argv[1], sys.argv[2]
d = json.load(open(path))
to_remove = [k for k in d if name in k]
for k in to_remove: del d[k]
if to_remove:
    json.dump(d, open(path, 'w'), indent=2)
    print(f"  pruned    known_marketplaces.json: {to_remove}")
PY
fi

echo ""
echo "done. plugin state is fresh-user."
echo "next: cold-restart Claude Code, then add marketplace https://github.com/demasir/spotify-set-reorder"
