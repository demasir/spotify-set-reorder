# spotify-set-reorder

A Claude Code plugin that reorders Spotify playlists with natural language intent.

Drop a playlist URL and a goal — *"end of night, hypnotic prog house, lower energy"*, *"build a 90-min peak-time techno set"*, *"trim to 1hr contemplative MPB"* — and the plugin sequences your existing tracks around it. BPM and key/Camelot data come from public databases via WebSearch (Tunebat, SongBPM, Beatport listings), with LLM estimation as a fallback for niche tracks. The LLM contributes the cultural reading on top — scene, era, label, mood family.

Works for any genre. The weight given to harmonic strictness vs. narrative arc adapts to what the catalog actually is.

## What's in the box

- **Skill** `/spotify-set-reorder` — the workflow itself, 9 steps with checkpoints
- **MCP server** — embedded fork of [marcelmarais/spotify-mcp-server](https://github.com/marcelmarais/spotify-mcp-server) with PKCE auth (no client secret) and patches for the Feb 2026 Spotify API migration
- **Helper script** `apply_reorder.py` — does the one Spotify operation the MCP doesn't expose (atomic REPLACE of a playlist's full track list)

## Requirements

- Claude Code (latest)
- Node.js 16+ (the embedded MCP server is Node/TypeScript)
- Python 3.8+ with `requests` (for the local helper script)
- A Spotify account — **Premium required** (Spotify mandated this for Development Mode API access as of March 2026)
- A Spotify Developer App (you create one — takes ~90 seconds, instructions below)

## Install

```
/plugin install github.com/demasir/spotify-set-reorder
```

Then `/reload-plugins` (or restart Claude Code).

## Set up Spotify access (one time, ~90 seconds)

The first time you invoke the skill, it'll guide you through this — but here's the full flow if you want to do it in advance:

1. **Create a Spotify Developer App**
   - Open https://developer.spotify.com/dashboard
   - Click **Create app**
   - Fill in:
     - App name: anything (e.g. "claude-set-reorder")
     - Description: anything
     - **Redirect URI**: `http://127.0.0.1:8888/callback` *(must match exactly)*
     - APIs/Services: check **Web API**
   - Accept terms, click Save
2. **Add yourself to the app's allowlist**
   - In your app's dashboard, go to **Users and Access**
   - Click **Add new user**
   - Enter the Spotify account email + display name you use to listen
   - This is required for Development Mode apps as of 2026 (your own account is **not** auto-added)
3. **Copy your Client ID** (no need for Client Secret — the plugin uses PKCE)
4. **Run the skill** — when prompted, paste the Client ID. The plugin will:
   - Write the minimal config to its plugin data dir
   - Open a browser to Spotify for OAuth consent
   - Capture the callback on `127.0.0.1:8888` and save your tokens
   - Tokens refresh automatically thereafter

## Use

```
/spotify-set-reorder
> [paste a Spotify playlist URL] + [your intent]
```

Examples of intents that work well:

- *"end of night, hypnotic prog house, lower energy"*
- *"warm up for a melodic techno set, 60-90 min"*
- *"contemplative listening session, MPB pós-2000"*
- *"reorder for a 2hr drive, no heavy peaks"*
- *"transition from deep to driving over 75 minutes"*

The skill walks you through 9 steps with checkpoints — you can interrupt at any point, ask for variations, or swap individual tracks before it writes anything to Spotify.

By default it creates a **new** playlist (`"<original name> — reordered"`) so your source playlist stays intact. If you own the playlist and want in-place modification, the skill will detect that and offer it.

## How it works

The plugin combines three signals for every sequencing decision:

- **BPM / key / Camelot** — looked up per-track via WebSearch. Each track carries a `source` field (`websearch`, `partial`, `estimated`, `unknown`) so you see what's verified vs. inferred. The skill doesn't fabricate numbers.
- **Cultural reading** — scene, era, label associations, mood family. The LLM contributes this from artist/title signal, doesn't invent context for artists it doesn't recognize.
- **Your intent** — the arc, duration, and context you described.

How much weight to give harmonic strictness vs. narrative pacing depends on the style. Electronic dance music asks for tight Camelot transitions and a designed BPM curve. Contemplative MPB or folk asks for emotional pacing where BPM is a constraint, not a guide. Same workflow handles both.

The full Camelot reference and design notes are in [`skills/spotify-set-reorder/references/`](skills/spotify-set-reorder/references/).

## Privacy and data

- **No data leaves your machine** other than:
  - Spotify API calls to read/modify your playlists (via the MCP server)
  - WebSearch queries for `<track title> <artist> bpm key` (via Claude Code's built-in tool)
- **Your tokens** live at `${CLAUDE_PLUGIN_DATA}/spotify-config.json` (managed by Claude Code per-plugin, gitignored by design, never sent anywhere)
- **No analytics, telemetry, or third-party calls** beyond what's listed above

## Troubleshooting

| Symptom | Fix |
|---|---|
| `403 Forbidden` on any API call | You probably forgot to add yourself to the app's **Users and Access** list. Spotify Dev Mode requires explicit allowlisting since 2026. |
| `401 Unauthorized` after weeks of working | Refresh token expired or revoked. Re-run the skill — it'll route you back to OAuth. |
| Browser doesn't open during auth | The skill prints the URL to console as a fallback — copy and paste it. |
| `BPM/key estimated` on many tracks | Catalog is niche or recent enough that public databases don't have it indexed. The skill flags this and leans more on cultural reading. |
| Plugin install fails | Make sure you're on the latest Claude Code. Plugins are a recent feature. |

## Contributing

Bug reports and PRs welcome. The skill design and harmonic-mixing rules are deliberately conservative — if you have a sequencing approach the current logic misses, open an issue with a specific example.

The bundled MCP server is a snapshot of [demasir/spotify-mcp-server](https://github.com/demasir/spotify-mcp-server) (a fork of marcelmarais/spotify-mcp-server with PKCE auth and Feb 2026 API patches). Server source lives in `servers/spotify-mcp-server/` — edit there and rebuild if needed.

## License

MIT
