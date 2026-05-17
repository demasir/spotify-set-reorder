#!/usr/bin/env bash
# SessionStart hook for spotify-set-reorder.
#
# Checks whether the user has completed Spotify auth. If not, emits a JSON
# response with a systemMessage field — Claude Code surfaces that in the
# chat as a visible nudge directing the user to /spotify-set-reorder:setup.
#
# When auth is already done, this script is silent.

set -euo pipefail

# CLAUDE_PLUGIN_DATA should always be set in plugin hook contexts. If it
# isn't, fail quietly — better to no-op than to mislead.
if [ -z "${CLAUDE_PLUGIN_DATA:-}" ]; then
  exit 0
fi

CONFIG="$CLAUDE_PLUGIN_DATA/spotify-config.json"

# Python does all the work — easier to handle JSON escaping correctly and
# avoid bash quoting traps.
python3 - "$CONFIG" <<'PY'
import json, os, sys

config_path = sys.argv[1]

MESSAGES = {
    "fresh": (
        "🎵 Welcome to spotify-set-reorder! One-time setup is required "
        "before first use. Run `/spotify-set-reorder:setup` and I'll walk "
        "you through it (~90 seconds — you create a small Spotify "
        "Developer app, paste one ID, authorize via your browser, done)."
    ),
    "partial": (
        "🎵 spotify-set-reorder is mid-setup — Client ID saved but no "
        "access token. Run `/spotify-set-reorder:setup` to finish the "
        "OAuth step."
    ),
}

def detect_state():
    if not os.path.exists(config_path):
        return "fresh"
    try:
        d = json.load(open(config_path))
    except Exception:
        return "partial"  # corrupt config — treat as needing repair
    if d.get("accessToken"):
        return "authenticated"
    if d.get("clientId"):
        return "partial"
    return "fresh"

state = detect_state()
if state == "authenticated":
    sys.exit(0)  # silent

print(json.dumps({"systemMessage": MESSAGES[state]}))
PY
