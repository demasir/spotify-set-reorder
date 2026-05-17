---
name: spotify-set-reorder
description: Reorder a Spotify playlist using natural language intent. Use this skill whenever the user wants to reshape a playlist for a specific listening context — DJ sets (warm-up, peak time, mid-set, closer, afters, handoff), curated home listening sessions, vibe transitions, mood shifts, or any case where they want existing tracks resequenced according to a stated goal. Triggers on: passing a Spotify playlist link plus a natural language intent like "build a 2hr peak-time set", "trim to 1 hour contemplative", "transition deep to driving"; mentions of reordering tracks, building DJ sets from existing material, curating listening sessions, applying BPM/key/Camelot-aware sequencing. Works for any genre — BPM and key signals come from WebSearch over public databases (Tunebat, SongBPM, Beatport listings), with LLM estimation as fallback when search returns nothing. The LLM contributes the cultural / contextual reading of the catalog on top of those signals. Make sure to use this skill whenever a Spotify playlist link appears alongside a curation goal, even if the user does not explicitly say "reorder".
---

# spotify-set-reorder

Reorder a Spotify playlist according to a stated intent. One workflow, applied uniformly to any genre.

**Three signals drive every decision:**

- **BPM and key/Camelot** — looked up per track via WebSearch (Step 2). Real numbers when public databases have them indexed; estimated from genre knowledge when they don't. Every track carries a `source` so the user knows what's verified vs. inferred.
- **Cultural / contextual reading** — your job (LLM). Artists, eras, scenes, label associations, mood family of each track. Recover this from artist names and titles; don't fabricate.
- **User intent** — the arc, context, and duration the user described.

How much weight to give Camelot strictness vs. narrative arc depends on the style you identify in Step 4. Electronic dance music asks for tight Camelot transitions and a designed BPM curve. Contemplative MPB asks for emotional pacing where BPM is a constraint, not a guide. Both flow through the same nine steps.

## Dependencies

- **spotify-mcp-server** ([marcelmarais/spotify-mcp-server](https://github.com/marcelmarais/spotify-mcp-server)) — authenticated and registered with the Claude Code client. Provides MCP tools used in Steps 1, 3, 8 (copy mode).
- **Local script** `scripts/apply_reorder.py` — handles in-place REPLACE (the operation the MCP doesn't expose) and an ownership-check helper. Reads token from the MCP's config file.
- **`WebSearch` tool** (built-in Claude Code) — used in Step 2 to look up BPM and key per track. No setup required.

If any dependency is missing, follow `references/setup.md` before attempting Step 1.

## A note on enrichment data

Spotify's Audio Features endpoint was restricted to existing-quota apps only in November 2024. Beatport's public client_id was decommissioned. The fallback we landed on is **WebSearch over public BPM/key databases (Tunebat, SongBPM, Beatport listings, etc.) plus LLM estimation from genre knowledge when WebSearch returns nothing useful**. This is good enough for sequencing decisions but is *less precise than direct API data*. Every track's BPM/key gets a `source` field — `websearch`, `estimated`, or `unknown` — and the user sees that in Step 7. Don't pretend a number is verified when it isn't.

## Inputs

1. Spotify playlist URL (open.spotify.com/playlist/... or spotify:playlist:...)
2. Natural language intent (the desired outcome)

## Workflow

Follow this sequence. The user gets checkpoints to interrupt or correct.

### Step 1 — Fetch tracks via MCP

Call the MCP tool **`getPlaylistTracks`** with the playlist ID extracted from the user's URL. Paginate with `limit` and `offset`: this MCP caps `limit` at **50 per call** (not Spotify's 100), so for playlists >50 tracks issue successive calls with `offset = 0, 50, 100, …`.

The MCP returns a **markdown text block**, one track per line, in this exact shape:

```
# Tracks in Playlist (1-50 of N)

1. "Track Title" by Artist1, Artist2 (3:45) - ID: 4iV5W9uYEdYUVa79Axb7Rh
2. "Another Track" by SomeArtist (4:12) - ID: 7qiZfU4dY1lWllzX7mPBI3
...
```

Parse this into a structured list. For each line, extract:

- `title` — text between the first `"` and the `" by ` separator
- `artists` — split the text between `" by ` and ` (` by `", "`
- `duration` — text inside `(...)` just before ` - ID:` (format `m:ss`)
- `spotify_id` — text after `- ID: ` to end of line
- `uri` — derive as `spotify:track:<spotify_id>`

Skip lines like `N. [Removed track]` or `N. Unknown item`. Also skip podcast episodes and local files if they appear (no enrichment possible and the REPLACE endpoint may reject local URIs).

If fetch fails (404, 401), surface the actual error. Don't paper over — first-run issues usually mean the MCP isn't set up; direct the user to `references/setup.md`.

### Step 2 — Enrich with BPM and key (WebSearch)

For each track, look up BPM and key using the **`WebSearch`** tool. Issue queries in this exact form:

```
<title> <primary artist> bpm key
```

Examples:
- `Move D To the Disco 77 bpm key`
- `Galcher Lustwerk Cig Angel Dance Mix bpm key`

**Do not** add `tunebat`, `songbpm`, `camelot`, or quoted phrases — the more qualified the query, the worse the results in practice. Plain queries pull richer structured snippets.

For each search, parse the WebSearch summary for:

- **BPM** — a number like `120 BPM` or `Tempo of 121`
- **Key** — typically `<note> Major` or `<note> Minor`. Watch for ambiguous reports ("G" without a mode); flag as uncertain.
- **Camelot** — sometimes in snippet as `10B`, `7A`, etc. If absent, **derive** it from the key using `references/camelot.md`.

**Issuing in parallel:** WebSearches are independent — fire them in batches of up to 5 in a single tool-call message to keep latency tolerable. For a 45-track playlist that's ~9 batches.

**Build an enriched JSON** like this, mirroring the Step 1 shape with a new `audio` field:

```json
{
  "tracks": [
    {
      "title": "To the Disco '77",
      "artists": ["Move D"],
      "uri": "spotify:track:0OvwOCehqyC5xe6VOir4V5",
      "duration": "6:59",
      "audio": {
        "bpm": 120,
        "key": "D minor",
        "camelot": "7A",
        "source": "websearch"
      }
    }
  ]
}
```

`source` field values:
- `"websearch"` — both BPM and key came from a confident snippet match for the right title+artist
- `"partial"` — one field came from snippet, the other is missing or low-confidence (e.g. BPM yes, key ambiguous)
- `"estimated"` — WebSearch returned nothing useful for this track, so you estimated from genre knowledge. State the basis in the justification later. Example: "Move D's deep house catalog typically sits 118-122 BPM in minor keys; estimating 120 BPM / D minor for arc purposes."
- `"unknown"` — couldn't even estimate confidently (very obscure track, ambient/spoken-word). Treat the track as harmonically isolated in Step 6.

**Cross-checking** is non-negotiable: if a snippet returns BPM/key but the title or artist visible in the snippet doesn't match your track (different remix, cover, same-titled different song), **reject the data** and mark as `estimated` or `unknown`. Don't infer "close enough."

Aim for ≥80% of tracks with `source: websearch` or `partial`. If much lower than that, the playlist is too niche for WebSearch — fall back to mostly `estimated` and warn the user in Step 3.

Write the enriched JSON to `/tmp/enriched.json` for downstream steps to reference.

### Step 3 — Report findings

Tell the user what you fetched, before generating anything:

```
Fetched [N] tracks from [playlist name].
BPM range: [min] to [max] (median [median])
Key distribution: [top 3 keys with counts]
Top artists: [top 5 by appearance count]
Total duration: [hh:mm]
Enrichment sources: [X websearch | Y partial | Z estimated | W unknown]
```

This is data reporting only — no interpretation yet. The user gets a feel for the raw material before you propose anything.

If the `estimated + unknown` share is high (>30%), say so explicitly: "Much of the BPM/key data is estimated rather than verified — sequencing decisions will rely more on cultural reading than on exact numbers."

### Step 4 — Identify dominant style and vibe (2-3 paragraphs)

Now interpret. Be specific. Not "house music" but "Afterlife-camp melodic techno". Not "MPB" but "MPB contemplativa pós-2000 ancorada em Pernambuco e SP". Reference labels (when known from artist signature), eras, scene contexts. Note clusters if the playlist is stylistically mixed.

Cover all three:

- **Stylistic identity** — scene, era, label associations, mood family
- **Sonic shape** — what the BPM range and key distribution tell you. Tight BPM cluster + minor-key dominance often signals melodic techno or trance; wide BPM + mode mix often signals indie/MPB/eclectic
- **Listening contexts the style traditionally serves** — what kind of arc this catalog is designed for

Present this to the user. Let them correct your read before heavy sequencing work.

### Step 5 — Validate intent against composition

Check whether the user's stated intent is achievable given the material:

- **BPM coverage** — does the BPM range support the requested arc? (e.g. "peak-time techno set" needs tracks in 128-135 BPM range; a playlist topping out at 118 BPM won't deliver)
- **Duration realism** — given track count and average length, is the target duration reachable?
- **Energy / mood range** — does the energy and valence distribution support the requested emotional shape?
- **Harmonic islands** — tracks with no Camelot neighbor in the playlist. Acceptable, but flag them as needing mitigation in transitions.
- **Outliers** — tracks that fall stylistically or harmonically outside the cluster. Propose to drop or to feature deliberately.

If intent isn't supportable, **stop and propose alternatives**. Don't generate a plan that masks a real mismatch.

### Step 6 — Generate the new order

The principles below are universal. The weight you give each one is style-dependent — judge from Step 4.

**Energetic arc:**
- Open with the gentlest entry point that establishes the tone
- First major peak / emotional anchor after the first third
- Main peak at ~60-70% of duration
- Multiple peaks should be spaced ~15-20% of total duration apart; if forced closer, declare as "twin peak" design
- Decay / resolution in the last 10-15% — UNLESS it's a handoff to another set (DJ context) or an intentionally open ending, in which case sustain or lift

**Harmonic flow (Camelot):**
- Prefer Camelot-clean transitions: same key, switch letter (relative major/minor), or ±1 number same letter
- Flag jumps >1 step with an explicit mitigation note (filter sweep, breakdown bridge, cold drop as deliberate moment)
- For electronic dance music, harmonic flow is load-bearing — break it only with intent
- For genres where Camelot matters less (folk, hip-hop, jazz), use it as a tiebreaker between otherwise-equivalent sequencing choices
- See `references/camelot.md` for the wheel and transition quality ranking

**BPM curve:**
- Smooth jumps preferred; threshold is genre-dependent (tech house tolerates ±5 BPM, melodic techno wants ≤±2-3)
- Don't enforce a strict "no jumps" rule on non-dance catalogs — there, BPM is a felt-energy proxy, not a mix constraint

**Narrative / cultural sequencing:**
- Cluster scenes / eras / sub-styles when it creates flow; break the cluster when it would become monotonous
- Avoid back-to-back same-artist unless intentional and called out
- Reserve emotional weight for the middle, not the start

**For every track in the output:**
- A **specific justification**, never generic. Cite producer, label, era, signature characteristic, or the harmonic/energetic role it plays in the arc. "Fits the vibe" is banned.
- Declare trade-offs out loud when a sequencing choice has a downside.

### Step 7 — Preview diff

Show old → new with track-level justifications. Format:

```
[Old #] → [New #]  Track — Artist
                    [BPM | Camelot | Energy]
                    Justification: ...
                    → Transition: ...   (when harmonic flow is load-bearing)

DROPPED:
[Old #]  Track — Artist (reason)

ARC SUMMARY:
BPM curve / peaks marked, narrative arc described
```

If you didn't drop anything, omit the DROPPED section. The arc summary is always present.

**Ask explicit confirmation before any write.** Do not assume "go" from the absence of a no.

### Step 8 — Apply

Decide path: **in-place** (modify the original playlist) or **copy** (create a new playlist).

Check ownership first with our local helper:

```bash
python scripts/apply_reorder.py --playlist <url> --check-ownership
```

It returns `{"is_owner": bool, ...}`. Then:

**If `is_owner: true` and user wants in-place (default):**

Write the new URI order to a JSON file (a flat list of Spotify URIs in desired order), then:

```bash
python scripts/apply_reorder.py --playlist <url> --order /tmp/new-order.json
```

This is the operation the MCP doesn't expose — our script handles only this. It also writes a backup of the current order to `/tmp/spotify-reorder-backup-<id>-<timestamp>.json` and prints the path, so the user can recover if needed.

**If `is_owner: false` OR user requests copy:**

Use MCP tools, no local script needed:

1. Call **`createPlaylist`** with name `"<original name> — reordered"`, description "Reordered by spotify-set-reorder", `public: false`
2. Call **`addTracksToPlaylist`** with the new playlist ID and the ordered URI list. If >100 URIs, batch into multiple calls of 100.

If the MCP is not yet registered with Claude Code, call the REST endpoints directly with the same token (`SPOTIFY_MCP_CONFIG`):

- **Create**: `POST https://api.spotify.com/v1/me/playlists` with body `{"name": "...", "description": "...", "public": false}`. **Do NOT** use `/users/{user_id}/playlists` — that path returns 403 since the late-2024 endpoint consolidation; only `/me/playlists` works for new apps.
- **Add tracks**: `POST https://api.spotify.com/v1/playlists/{new_id}/items` with body `{"uris": [...]}`. Cap of 100 URIs per call; batch if needed.

If any step fails, surface the actual error. Don't retry silently.

### Step 9 — Confirm and offer iteration

Tell the user:
- What was applied (in-place / copy) and the result URL
- Backup path (in-place only)
- Any tracks skipped
- Offer: "darker variation?", "swap track X?", "extend to 90min?"

If iterating, jump back to **Step 6**. Reuse enriched data; don't refetch from Spotify unless the user changed the playlist or asked to drop a track that's missing data.

## Token sharing

`apply_reorder.py` reads its access token from the MCP's `spotify-config.json`. Provide the path via `--config` or set `SPOTIFY_MCP_CONFIG`. Setup details in `references/setup.md`.

The MCP refreshes the token automatically when its tools are called, so for any flow that touched an MCP tool in this conversation, the token is fresh. If the token has aged (first run, long gap, etc.), the script will print a 401 hint pointing back to the MCP.

WebSearch (Step 2) does not use the Spotify token at all — it's a separate Claude Code tool.

## Honesty principles (non-negotiable)

- **Declare composition** before generating any plan (BPM range, key distribution, top artists)
- **Declare trade-offs** for non-obvious sequencing choices
- **Specific justifications**, never generic
- **Flag problems before generating**, not after the user has been shown a plan that hides them
- **Don't fabricate BPM / key** — if Spotify returned null for a track, leave it null and treat it as harmonically isolated in Camelot reasoning
- **Don't fabricate cultural context** — if you don't recognize the artist or label, say so rather than guessing
- **Confirm before write** — never apply changes without explicit user confirmation in chat

## Out of scope for MVP

- Dynamic mid-playback reorder (one-shot apply only)
- Multi-playlist merge
- Recommending tracks NOT in the playlist
- Generating audio features locally (no audio download / waveform analysis). Step 6 treats tracks with `source: unknown` as harmonically isolated.
