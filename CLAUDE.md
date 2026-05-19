# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this repo is

A Claude Code **plugin**, distributed via Claude Code's plugin marketplace — not a standalone app. End-users install it through `/plugin` in their own Claude Code session; this repo is the source they install from. Two distinct audiences for code in here:

- **End-users** run the plugin via the `/spotify-set-reorder` skill, after a one-time `/spotify-set-reorder:setup`.
- **You (the contributor)** edit the plugin source: the bundled MCP server (TypeScript), the two skills (`setup`, `spotify-set-reorder`), the Python helper, and the onboarding hook.

## Layered layout (why the nesting)

```
.claude-plugin/marketplace.json     ← marketplace manifest (points at ./plugins/spotify-set-reorder)
plugins/spotify-set-reorder/
  .claude-plugin/plugin.json        ← plugin manifest; registers SessionStart hook
  .mcp.json                         ← declares the bundled MCP server with ${CLAUDE_PLUGIN_DATA} for token path
  scripts/check-auth.sh             ← SessionStart hook; emits JSON systemMessage nudge if auth missing
  skills/setup/SKILL.md             ← first-run OAuth wizard (PKCE)
  skills/spotify-set-reorder/
    SKILL.md                        ← the 9-step reorder workflow (load-bearing — this IS the product)
    scripts/apply_reorder.py        ← Python helper; the only operation the MCP doesn't expose
    references/{setup,camelot}.md   ← reference material the skill links into context as needed
  servers/spotify-mcp-server/       ← embedded fork of marcelmarais/spotify-mcp-server
    src/                            ← TS source
    build/                          ← esbuild output (COMMITTED — see "build artifact policy" below)
scripts/dev-reset.sh                ← wipes local plugin state for repeatable onboarding tests
```

The marketplace `.claude-plugin/` is at the repo root; the plugin `.claude-plugin/` is one level down. This dual nesting is intentional — a single marketplace can host multiple plugins, even though this one only hosts one.

## Commands

### MCP server (`plugins/spotify-set-reorder/servers/spotify-mcp-server/`)

```bash
npm install               # only needed for dev; end-users run the built JS directly
npm run build             # esbuild bundles src/index.ts + src/auth.ts → build/{index,auth}.js (both made +x)
npm run typecheck         # tsc --noEmit
npm run lint              # biome check
npm run lint:fix          # biome check --write
npm run auth              # build + run build/auth.js (OAuth flow) — for standalone testing of auth alone
```

### Dev reset (onboarding test loop)

```bash
./scripts/dev-reset.sh --dry-run    # show what would change
./scripts/dev-reset.sh              # interactive (confirms)
./scripts/dev-reset.sh --yes        # non-interactive
```

Wipes `~/.claude/plugins/{cache,data,marketplaces}/spotify-set-reorder`, `/tmp/enriched.json`, `/tmp/spotify-reorder-backup-*.json`, and prunes plugin entries from `installed_plugins.json` and `known_marketplaces.json`. Does **not** touch the workspace source or the MCP fork. Reports `~/.claude/skills/spotify-set-reorder` symlinks and `~/.claude.json` MCP entries but leaves those for manual handling.

## Architecture notes that span multiple files

**PKCE flow, not authorization-code-with-secret.** The bundled MCP server's OAuth (`servers/spotify-mcp-server/src/auth.ts` + `utils.ts`) was patched away from the upstream marcelmarais flow to **PKCE only** — no client secret is stored or required. The `setup` skill and `check-auth.sh` both depend on this. Note: `skills/spotify-set-reorder/references/setup.md` still describes the *upstream* secret-based flow — it's a legacy doc kept for users coming from the standalone MCP path, and does not reflect how the plugin's `setup` skill actually works. If you're documenting setup for plugin users, the source of truth is `skills/setup/SKILL.md`.

**Token storage path is injected by Claude Code.** `.mcp.json` passes `SPOTIFY_CONFIG_PATH=${CLAUDE_PLUGIN_DATA}/spotify-config.json` into the MCP process. `${CLAUDE_PLUGIN_DATA}` resolves to a per-plugin directory the harness manages — `~/.claude/plugins/data/spotify-set-reorder/` in practice. The `setup` skill writes to the same path via `$CLAUDE_PLUGIN_DATA` (set in skill Bash context too), and `check-auth.sh` reads from it. **Never hardcode this path** — always use the env var.

**Three pieces share one token file:** the MCP server (refreshes the token automatically when its tools are called), the `setup` skill (writes initial tokens via `auth.js`), and the Python helper (read-only consumer). The Python helper accepts `--config <path>` or reads `SPOTIFY_MCP_CONFIG`; inside the plugin, point it at `$CLAUDE_PLUGIN_DATA/spotify-config.json`.

**Why `apply_reorder.py` exists.** The MCP exposes `reorderPlaylistItems` but that's a *move-slice* primitive (Spotify's `PUT /playlists/{id}/items` with `range_start`/`insert_before`/`range_length`). Applying an arbitrary N-track permutation through it would require ~N successive calls with shifting indices. The Python script uses the **REPLACE** endpoint (`PUT /playlists/{id}/tracks` with full `uris` array) — atomic, one call. That's the *only* operation the script does that the MCP can't; everything else (createPlaylist, addTracksToPlaylist, getPlaylistTracks) stays on the MCP path. Also handles `--check-ownership`.

**Build artifact policy.** `servers/spotify-mcp-server/build/` is **committed**. End-users install the plugin and immediately run `node build/index.js` — they don't run `npm install`. When editing the MCP, always run `npm run build` and commit the rebuilt `build/{index,auth}.js`. The `auth.js` bundle in particular is what `setup/SKILL.md` invokes directly (`node $CLAUDE_PLUGIN_ROOT/servers/spotify-mcp-server/build/auth.js`).

**SessionStart hook is silent on success.** `check-auth.sh` exits 0 with no output when authenticated; emits `{"systemMessage": "..."}` JSON only when `fresh` or `partial`. Claude Code surfaces that systemMessage in the chat. Format must stay valid JSON on a single line — broken output silently breaks the nudge.

**`/tmp/enriched.json` is a per-run cache.** Step 0.5 of the main skill checks the cached `playlist.id` and deletes the file if it doesn't match the current request. Don't reuse mismatched enrichment data — that was a documented bug. `dev-reset.sh` clears it.

## API gotchas baked into the code

- **MCP `getPlaylistTracks` caps `limit` at 50**, not Spotify's 100. The skill paginates with `offset = 0, 50, 100, …` accordingly.
- **Use `/me/playlists` for creates**, not `/users/{user_id}/playlists` — the latter returns 403 since Spotify's late-2024 endpoint consolidation for new apps.
- **Spotify Audio Features endpoint** was restricted to existing-quota apps in Nov 2024 — that's why enrichment goes through WebSearch instead. Don't try to bring it back.
- **Spotify Premium is required** for Developer Mode API access since March 2026, regardless of which endpoints you touch.

## Versioning

`plugin.json` and `marketplace.json` both carry the plugin version — keep them in sync. The MCP server's `package.json` version is independent and not user-visible.

<!-- SPECKIT START -->
Active feature plans live under `specs/<NNN>-<slug>/`. Latest:

- [`specs/001-readme-coverage-cost/`](specs/001-readme-coverage-cost/) — Honest README (use cases, validation coverage, expected cost, feedback channel). Shipped in v0.3.0 ([PR #5](https://github.com/demasir/spotify-set-reorder/pull/5)). The `runs/` directory holds the evidence base for the README's data-driven sections; the `contracts/` directory holds the shape contracts a reviewer can grep against.

Each feature directory follows: `spec.md` (goal), `plan.md` (approach), `research.md` (decisions), `tasks.md` (work breakdown), plus `contracts/` and `runs/` as needed.
<!-- SPECKIT END -->
