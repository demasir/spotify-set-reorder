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

## Install (one-liner)

In Claude Code:

1. Open the plugins UI (`/plugin` → **Marketplaces** → **Add**)
2. Paste: `https://github.com/demasir/spotify-set-reorder`
3. Switch to the **Plugins** tab → install `spotify-set-reorder`

That's it for the install. Restart Claude Code if it asks.

## First-run setup (~90 seconds)

**On your next Claude Code session after install, you'll see a friendly nudge:**

> 🎵 Welcome to spotify-set-reorder! One-time setup is required before first use. Run `/spotify-set-reorder:setup` and I'll walk you through it.

Run that command and follow the prompts. The setup wizard handles everything: creating a Spotify Developer app, capturing your Client ID, completing OAuth via your browser. Tokens are stored in your plugin data directory and never leave your machine.

What the setup does, briefly:

1. Opens the [Spotify Developer Dashboard](https://developer.spotify.com/dashboard/create) in your browser
2. Asks you to fill in a tiny app (name, redirect URI `http://127.0.0.1:8888/callback`, check Web API)
3. You paste back the **Client ID** (no Client Secret needed — this plugin uses PKCE)
4. A browser tab opens for you to authorize the app on your Spotify account
5. Tokens get saved automatically and refresh themselves thereafter

Requires **Spotify Premium** — Spotify's rule for Developer Mode API access since March 2026.

**If you didn't see the welcome nudge** (it only shows on the next session after install): just run `/spotify-set-reorder:setup` manually.

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

The full Camelot reference and design notes are in [`plugins/spotify-set-reorder/skills/spotify-set-reorder/references/`](plugins/spotify-set-reorder/skills/spotify-set-reorder/references/).

## Privacy and data

- **No data leaves your machine** other than:
  - Spotify API calls to read/modify your playlists (via the MCP server)
  - WebSearch queries for `<track title> <artist> bpm key` (via Claude Code's built-in tool)
- **Your tokens** live at `${CLAUDE_PLUGIN_DATA}/spotify-config.json` (managed by Claude Code per-plugin, gitignored by design, never sent anywhere)
- **No analytics, telemetry, or third-party calls** beyond what's listed above

## Troubleshooting

| Symptom | Fix |
|---|---|
| Skill says *"Spotify auth isn't set up yet"* | Run `/spotify-set-reorder:setup`. The skill is gating you correctly. |
| `403 Forbidden` on any API call (after setup) | Try adding your own Spotify email to the app's **Users and Access** tab in the dashboard. Most owners are auto-allowlisted but Spotify Dev Mode 2026 sometimes requires explicit entry. |
| `401 Unauthorized` after weeks of working | Refresh token expired or revoked. Run `/spotify-set-reorder:setup` again — it's idempotent and will refresh things. |
| Browser doesn't open during setup OAuth | The setup skill prints the URL as a fallback — copy and paste it into your browser. |
| Port 8888 already in use during OAuth | Another process is holding port 8888 (`lsof -i :8888` to find it). Close it and re-run setup. |
| `BPM/key estimated` on many tracks | Catalog is niche or recent enough that public databases don't have it indexed. The skill flags this and leans more on cultural reading. |
| Plugin install fails | Make sure you're on the latest Claude Code. Plugins are a recent feature. |

## Contributing

Bug reports and PRs welcome. The skill design and harmonic-mixing rules are deliberately conservative — if you have a sequencing approach the current logic misses, open an issue with a specific example.

The bundled MCP server is a snapshot of [demasir/spotify-mcp-server](https://github.com/demasir/spotify-mcp-server) (a fork of marcelmarais/spotify-mcp-server with PKCE auth and Feb 2026 API patches). Server source lives in `plugins/spotify-set-reorder/servers/spotify-mcp-server/` — edit there and rebuild if needed.

For repeatable onboarding testing, see `scripts/dev-reset.sh` — wipes the plugin's local state (cache, tokens, marketplace registration) so you can re-test the install/setup flow from a clean slate.

## License

MIT
