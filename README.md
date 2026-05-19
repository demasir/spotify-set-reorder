# spotify-set-reorder

A Claude Code plugin that reorders Spotify playlists with natural language intent.

Drop a playlist URL and a goal — *"end of night, hypnotic prog house, lower energy"*, *"build a 90-min peak-time techno set"*, *"trim to 1hr contemplative MPB"* — and the plugin sequences your existing tracks around it. BPM and key/Camelot data come from public databases via WebSearch (Tunebat, SongBPM, Beatport listings), with LLM estimation as a fallback for niche tracks. The LLM contributes the cultural reading on top — scene, era, label, mood family.

Designed to be catalog-agnostic — see [What's been validated](#whats-been-validated) below for the genres it has actually been demonstrated on. The weight given to harmonic strictness vs. narrative arc adapts to what the catalog actually is.

## What's in the box

- **Skill** `/spotify-set-reorder` — the workflow itself, 9 steps with checkpoints
- **MCP server** — embedded fork of [marcelmarais/spotify-mcp-server](https://github.com/marcelmarais/spotify-mcp-server) with PKCE auth (no client secret) and patches for the Feb 2026 Spotify API migration
- **Helper script** `apply_reorder.py` — does the one Spotify operation the MCP doesn't expose (atomic REPLACE of a playlist's full track list)

## Use cases

Three reorder intents the tool has been validated end-to-end on. Aspirations and untested workflows live in [What's been validated](#whats-been-validated) below.

- **Deep house (UK/NZ/Berlin, 2010s-20s)** — *"coding lift — animar subindo BPMs a partir de Santiago Black, contexto de coding/descanso, não peak time"* — produced a coherent 7-BPM climb (114→121) with a deliberate landing into Larry Heard's "Praise", anchored on a deliberate Move D pocket at peak. [run record](specs/001-readme-coverage-cost/runs/house-2026-05-18.md)
- **MPB (pós-90s eixo Recife-SP)** — *"fim de noite de código, preparar pra dormir"* — trimmed a 50-track playlist to 10 for a ~45-min sleep-prep descent, landing on Larry Heard's MPB-adjacent influence via Lenine/Cohen's "Resposta". [run record](specs/001-readme-coverage-cost/runs/mpb-2026-05-18.md)
- **Rock / psych / Afrobeat-jazz cluster** — *"preparar pra dormir"* — sequenced a 5-track mix (Rolling Stones, Black Sabbath, Kokoroko, Glue Trip, Broken Bells) as a 117→80 BPM descent, declaring a 27-BPM drop between tracks 1 and 2 as a deliberate trade-off. [run record](specs/001-readme-coverage-cost/runs/rock-2026-05-18.md)

## What's been validated

Two axes: **objective** (did the skill complete the workflow and write the result successfully?) and **subjective** (was the resulting sequence musically coherent?). Subjective is the load-bearing one; objective can pass while the music falls apart.

| Genre | Objective | Subjective | Notes |
|---|---|---|---|
| Deep house (UK/NZ/Berlin, 2010s-20s) | ✅ passed | ✅ coherent | 45-track playlist; user capped enrichment mid-flow at 25 tracks ([feedback informed a future skill update](specs/001-readme-coverage-cost/runs/house-2026-05-18.md)) |
| MPB (pós-90s eixo Recife-SP) | ✅ passed | ✅ coherent | 50-track sample trimmed to 10 for sleep-prep; sub-styles include geração 80s (Cazuza, Cássia Eller) and tropicalistas clássicos ([record](specs/001-readme-coverage-cost/runs/mpb-2026-05-18.md)) |
| Rock / psych / Afrobeat-jazz cluster | ✅ passed | ✅ coherent | 5-track mixed-cluster playlist; small sample but anglo bands index well on public BPM/key databases ([record](specs/001-readme-coverage-cost/runs/rock-2026-05-18.md)) |
| Singer-songwriter (chamber/folk) | ✅ passed | not rated | 4-track baseline run; verdict not formally rated — serves as the [cost-evidence measurement](specs/001-readme-coverage-cost/runs/singer-songwriter-2026-05-18.md) underpinning the "Expected cost" section below |
| Electronic dance — other (tech house, melodic techno, trance) | not run | n/a | Only deep house exercised within the house/electronic family; tighter-Camelot styles untested |
| Hip-hop / jazz (standalone) / samba / classical / metal | not run | n/a | None exercised in this feature; if your catalog lives here, the run note format is open for contributions |

## Expected cost

Token figures recorded from Claude Code session totals (`/usage`). The "Methodology" column tags how each band was derived. Per-run visibility inside the skill output is tracked at [issue #4](https://github.com/demasir/spotify-set-reorder/issues/4) and not yet shipped — until it does, the numbers below are session-level approximations.

| Playlist size | Total tokens (range) | Per-track avg | Methodology |
|---|---|---|---|
| ≤ 30 tracks | 62,000 – 80,000 | ~15,500 | single-run + per-track extrapolation (`singer-songwriter-2026-05-18.md` measured 4 tracks at 62k; `rock-2026-05-18.md` projected 5 tracks at 80k) |
| 31 – 100 tracks | 400,000 – 600,000 | ~13,000 | single-run + per-track extrapolation from the clean baseline (`house-2026-05-18.md` ~45 effective tracks ≈ 400k; `mpb-2026-05-18.md` 50 tracks ≈ 600k) |
| 101+ tracks | not measured | not measured | No 101+ run exists in this feature — band published for completeness with `not measured` per the spec's honesty rule. Tracked at [issue #4](https://github.com/demasir/spotify-set-reorder/issues/4). |

Per-track scaling is roughly linear because enrichment runs per-track (one WebSearch + a small share of the per-track sequencing/justification output). Token cost should be expected to grow proportionally with playlist size, modulo cache-hit benefits at longer session lengths.

## Requirements

- Claude Code (latest)
- Node.js 16+ (the embedded MCP server is Node/TypeScript)
- Python 3.8+ with `requests` (for the local helper script)
- A Spotify account — **Premium required** (Spotify mandated this for Development Mode API access as of March 2026)
- A Spotify Developer App (you create one — takes ~90 seconds, instructions below)

## Install

Two paths available — both tested end-to-end. Pick whichever fits your workflow.

### Path A — Slash-command (copy-paste)

In Claude Code, paste these two commands:

```text
/plugin marketplace add https://github.com/demasir/spotify-set-reorder
/plugin install spotify-set-reorder@spotify-tools
```

Recommended for users on a recent Claude Code build (slash commands for plugin management landed in 2025). Restart Claude Code if it prompts you.

### Path B — Plugins UI walkthrough

1. Open the plugins UI (`/plugin` → **Marketplaces** → **Add**)
2. Paste the repo URL: `https://github.com/demasir/spotify-set-reorder`
3. Switch to the **Plugins** tab → install `spotify-set-reorder`

Same result as Path A; preserved here because some teams prefer the UI flow and because it predates the slash-command path.

> Both install paths were verified end-to-end from a fresh Claude Code session on 2026-05-18 — see [install-verify-2026-05-18.md](specs/001-readme-coverage-cost/runs/install-verify-2026-05-18.md) for the run record (marketplace name, version, SessionStart hook fire).

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

## Feedback

Two kinds of feedback are welcome, both at [GitHub Issues](https://github.com/demasir/spotify-set-reorder/issues). Musical-quality feedback is the harder kind, the rarer kind, and the more valuable one — if a sequence felt off in a way you can articulate, that signal is *exactly* what the skill needs to improve, and we'd much rather hear it than not.

- **Mechanical issues** — title prefix `[bug]`. Include: the install path you used (slash-command or UI), the auth state at failure, the actual error output, and your Claude Code / Node.js / Python versions if relevant. Bonus points for steps to reproduce against a public playlist.
- **Musical-quality concerns** — title prefix `[musical]`. Include: the playlist link (if shareable), the original intent you passed to the skill, one paragraph on what felt wrong (a transition that broke flow, an arc that didn't land, a track placement that read as random). You don't need to propose a fix — naming the felt problem is already useful. We read these carefully.

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
