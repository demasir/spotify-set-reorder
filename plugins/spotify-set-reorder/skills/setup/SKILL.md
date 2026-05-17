---
name: setup
description: One-time authentication for the spotify-set-reorder plugin. Walks the user through creating a Spotify Developer app, capturing the Client ID, and completing OAuth (PKCE flow — no client secret required). Use this skill the first time someone installs the plugin, or whenever they see a "setup required" reminder, or whenever they ask to "authenticate", "set up Spotify", "connect Spotify", "log in to Spotify", or similar. Idempotent — safe to re-run; reports a friendly "you're already set up" message when valid tokens already exist.
---

# Spotify plugin setup

Walk the user through OAuth setup. Total time: ~90 seconds. One-time per machine.

The whole thing uses **PKCE** — no client secret to handle, no credentials embedded anywhere. The plugin just needs a Client ID from a Spotify Developer app the user creates, plus the user's consent through the standard OAuth browser flow.

## Tone

Warm, educational. The user might be new to Spotify Developer Dashboard — explain *why* each step matters, not just *what* to do. Avoid jargon when you can; when you can't, define it inline. Don't infantilize. Keep things short and signposted.

## Step 1 — Inspect current state

Run via Bash, capture the output:

```bash
CONFIG="$CLAUDE_PLUGIN_DATA/spotify-config.json"
if [ -f "$CONFIG" ]; then
  python3 -c "
import json, sys
try:
    d = json.load(open('$CONFIG'))
    has_id = bool(d.get('clientId'))
    has_token = bool(d.get('accessToken'))
    if has_token: print('STATE=AUTHENTICATED')
    elif has_id:  print('STATE=PARTIAL')
    else:         print('STATE=EMPTY')
    print('clientId=' + (d.get('clientId', '')[:6] + '...' if d.get('clientId') else 'none'))
except Exception as e: print('STATE=BROKEN')
"
else
  echo "STATE=FRESH"
fi
```

Branch on the result:

- `STATE=FRESH` → Step 2 (full setup)
- `STATE=PARTIAL` → Step 5 (resume OAuth with saved Client ID)
- `STATE=AUTHENTICATED` → Step 7 (already done — proactive suggestion)
- `STATE=BROKEN` → Tell the user the config file is corrupt, suggest deleting `$CLAUDE_PLUGIN_DATA/spotify-config.json` and re-running this skill

## Step 2 — Greet and frame the flow

Open with something like:

> Welcome! Let's get you set up to reorder Spotify playlists with natural language. This takes about 90 seconds and you do it once per machine.
>
> Here's the shape: we'll create a tiny "developer app" on Spotify's site (this is how Spotify exposes its API to third parties — you own the app, the plugin just uses it on your behalf), copy one ID from it, and then a browser tab will open for you to authorize the app to read/modify your playlists. No passwords or secrets to manage — we use the PKCE flow, the same one Spotify's own mobile app uses.
>
> Quick heads-up: Spotify requires a **Premium** account for developer mode API access (their rule since March 2026). Plugin won't work on Free.
>
> Ready? I'll open the dashboard for you.

Wait for confirmation (any "yes/go/ok/sim/bora" type response).

## Step 3 — Open the Spotify Developer Dashboard

```bash
open "https://developer.spotify.com/dashboard/create" 2>/dev/null || \
  echo "Browser didn't open automatically. Visit: https://developer.spotify.com/dashboard/create"
```

Then guide the user, in chat:

> Dashboard's open. Fill in these fields exactly:
>
> - **App name** — anything you like (e.g. `claude-set-reorder`)
> - **App description** — anything
> - **Redirect URI** — paste this EXACTLY: `http://127.0.0.1:8888/callback`
>   *(this is where the plugin listens for your auth tokens during the OAuth dance. If this doesn't match exactly, Spotify rejects the auth.)*
> - **APIs/Services** — check **Web API**
>
> Accept the terms, hit Save.
>
> You'll land on the app's page. Copy the **Client ID** (32 characters, looks like `783ecc31c9f44363941c6e9fb6bb1add`). You do NOT need the Client Secret — we use PKCE.
>
> Paste the Client ID here.

Wait for the user to paste it.

## Step 4 — Validate and write initial config

Validate the Client ID looks like a Spotify Client ID (32 hex characters):

```bash
CLIENT_ID="<paste-from-user>"
if [[ ! "$CLIENT_ID" =~ ^[a-f0-9]{32}$ ]]; then
  echo "ID doesn't look right — Spotify Client IDs are 32 hex characters. Double-check what you copied."
  exit 1
fi
```

If it looks valid, write the initial config:

```bash
mkdir -p "$CLAUDE_PLUGIN_DATA"
cat > "$CLAUDE_PLUGIN_DATA/spotify-config.json" <<EOF
{
  "clientId": "$CLIENT_ID",
  "redirectUri": "http://127.0.0.1:8888/callback"
}
EOF
```

Tell the user:

> Got it, Client ID saved. Now I'll kick off the OAuth flow — a browser tab will open asking you to authorize the app. Click **Agree**, and the rest is automatic.

## Step 5 — Run the OAuth flow

Spawn the auth subprocess. This is foreground — it opens the browser, runs a local server on `127.0.0.1:8888` to catch the redirect, exchanges the auth code for tokens (PKCE), saves them to the config file, and exits.

```bash
SPOTIFY_CONFIG_PATH="$CLAUDE_PLUGIN_DATA/spotify-config.json" \
  node "$CLAUDE_PLUGIN_ROOT/servers/spotify-mcp-server/build/auth.js"
```

Typical duration: 5-30 seconds (depending on how fast the user clicks Agree).

If the subprocess errors, surface the actual error and suggest:
- **Port 8888 in use** → "Another process is holding port 8888. Close it and try again, or run `lsof -i :8888` to find it."
- **User denied authorization** → "You clicked Cancel. Run this skill again when you're ready to authorize."
- **Network/timeout** → "Couldn't reach Spotify. Check your connection and try again."
- **Other errors** → show the stderr verbatim, suggest re-running

## Step 6 — Verify

Confirm tokens landed in the config:

```bash
python3 -c "
import json, os
d = json.load(open(os.environ['CLAUDE_PLUGIN_DATA'] + '/spotify-config.json'))
print('OK' if d.get('accessToken') and d.get('refreshToken') else 'INCOMPLETE')
"
```

If `OK`, jump to Step 7 with the celebratory variant.
If `INCOMPLETE`, something went wrong silently — tell the user, suggest re-running.

## Step 7 — Confirm and suggest a next step (PROACTIVE)

If we just completed setup:

> ✓ Authenticated. You're ready to use the plugin.

If we found existing valid tokens (STATE=AUTHENTICATED at Step 1):

> ✓ You're already set up — nothing to do here. The plugin is ready.

In both cases, follow up with a proactive next-step suggestion:

> Try `/spotify-set-reorder` on a real playlist. The skill walks through 9 steps with checkpoints, so you can correct or redirect at any point before anything writes to Spotify. Some intents that work well to start:
>
> - *"wind down at the end of the night, hypnotic prog house, lower energy"*
> - *"60-min warm-up set, melodic techno, building gradually"*
> - *"trim to 90 minutes contemplative, MPB pós-2000"*
> - *"reorder for a 2-hour drive, no heavy peaks"*
>
> Got a playlist URL you want to test on? Drop it in, plus what you're going for.

Don't prompt further — let the user reply when they're ready.

## Notes for Claude running this skill

- The `$CLAUDE_PLUGIN_ROOT` and `$CLAUDE_PLUGIN_DATA` env vars are set by Claude Code's plugin runtime and ARE available in Bash invocations within this skill. Use them as shown.
- `auth.js` (the OAuth subprocess) was built with esbuild as a single self-contained file — it doesn't need `npm install` to run.
- If the user gets a 403 error AFTER auth (later, when using the main skill), it's likely a missing entry in the Spotify app's "Users and Access" tab. That's a defensive note, not a step in this flow — most users won't need it.
- Re-running this skill is always safe. Step 1's state detection handles every case.
