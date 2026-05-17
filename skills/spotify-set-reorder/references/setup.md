# Setup

One-time. ~10 minutes if you have Node.js installed; ~15 if you don't.

## 1. Install spotify-mcp-server

```bash
git clone https://github.com/marcelmarais/spotify-mcp-server.git
cd spotify-mcp-server
npm install
npm run build
```

Requires Node.js v16+. (Premium account is listed in their README but is only needed for playback control — playlist read/modify works on Free too.)

## 2. Create a Spotify Developer App

1. Go to https://developer.spotify.com/dashboard and log in
2. **Create app**
3. Fill in:
   - App name: anything (e.g. "spotify-set-reorder")
   - Description: anything
   - **Redirect URI**: `http://127.0.0.1:8888/callback` — must match exactly
   - APIs/Services: check **Web API**
4. Save. From the app dashboard:
   - Copy the **Client ID**
   - Click "Show Client Secret" and copy the **Client Secret** (the MCP uses authorization code flow, not PKCE — secret is required)

## 3. Configure the MCP

In the `spotify-mcp-server` directory:

```bash
cp spotify-config.example.json spotify-config.json
```

Edit `spotify-config.json`:

```json
{
  "clientId": "<your client id>",
  "clientSecret": "<your client secret>",
  "redirectUri": "http://127.0.0.1:8888/callback"
}
```

Then authenticate:

```bash
npm run auth
```

Browser opens, you consent, and the MCP writes `accessToken` and `refreshToken` back into `spotify-config.json`. Token refreshes automatically thereafter.

## 4. Register the MCP with Claude Code

Add the MCP to your Claude Code MCP config. The exact path depends on your Claude Code install — check `claude mcp` docs. The block looks like:

```json
{
  "mcpServers": {
    "spotify": {
      "command": "node",
      "args": ["/absolute/path/to/spotify-mcp-server/build/index.js"]
    }
  }
}
```

After registering, restart Claude Code. The MCP tools (`getPlaylistTracks`, `createPlaylist`, `addTracksToPlaylist`, etc.) become available.

## 5. Point the local script at the MCP's config

`apply_reorder.py` shares the MCP's access token. Tell it where to find the MCP config:

```bash
export SPOTIFY_MCP_CONFIG=/absolute/path/to/spotify-mcp-server/spotify-config.json
```

Add this to your shell rc file (`~/.zshrc`, `~/.bashrc`) to persist. Alternatively, pass `--config <path>` on every script invocation.

## 6. BPM / key enrichment — no extra setup

Step 2 of the skill uses the built-in `WebSearch` tool (queries like `<title> <artist> bpm key`). No API keys, no separate auth. Snippets from public databases (Tunebat, SongBPM, Beatport) carry the data when it exists; the LLM estimates from genre knowledge when WebSearch turns up nothing.

Previous attempts:
- Spotify Audio Features — restricted to existing-quota apps in Nov 2024
- Beatport — public client_id decommissioned; partner-only program rejects hobby use
- Tunebat / SongBPM direct scraping — Cloudflare blocks both WebFetch and `requests`

## Sanity check

After all the above, run:

```bash
python scripts/apply_reorder.py --playlist "https://open.spotify.com/playlist/<some-playlist-you-own>" --check-ownership
```

Expected output: JSON with `is_owner: true`. If you get a token error, run `npm run auth` again in the MCP repo.

## Troubleshooting

| Symptom | Likely cause | Fix |
|---|---|---|
| `Config not found` | `SPOTIFY_MCP_CONFIG` not set or wrong path | Re-export the env var with absolute path |
| `No accessToken in config` | MCP wasn't authenticated | Run `npm run auth` in the MCP repo |
| Spotify 401 | Token expired and refresh failed | Run `npm run auth` again |
| Spotify 403 on reorder | You don't own the playlist | Use copy mode (MCP `createPlaylist` + `addTracksToPlaylist`) instead |
| WebSearch returns no BPM/key for a track | Niche / underground / very recent | Skill marks `source: estimated` and the LLM infers from genre. Step 7 surfaces these explicitly so the user knows. |
| MCP tools not visible to Claude Code | Registration not picked up | Restart Claude Code; verify path in MCP config block is absolute |
