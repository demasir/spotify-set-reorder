"""
In-place reorder for a Spotify playlist.

The marcelmarais/spotify-mcp-server MCP exposes `reorderPlaylistItems`,
but it is a move-slice primitive (PUT /playlists/{id}/items with
range_start / insert_before / range_length). Applying an arbitrary
N-track permutation through it would require ~N successive calls with
shifting indices — slow and error-prone.

This script uses the REPLACE endpoint (PUT /playlists/{id}/tracks with
`uris`) instead, which is atomic and simple for a full permutation. That
is the operation the MCP does NOT expose, and the only thing this script
does.

Shares the MCP's stored access token from spotify-config.json. Point at it
via --config or SPOTIFY_MCP_CONFIG env var.

Two modes:

  Check ownership:
    python apply_reorder.py --playlist <url-or-id> --check-ownership
    → prints {"is_owner": true|false, "owner_id": "...", "me_id": "..."}

  Apply reorder in-place (replaces playlist content with new URI order):
    python apply_reorder.py --playlist <url-or-id> --order <new-uris.json>
    → prints {"result_url": "...", "tracks_applied": N}

For "copy mode" (create a new playlist instead), use the MCP directly:
    createPlaylist → addTracksToPlaylist
"""

import argparse
import datetime
import json
import os
import re
import sys
import time
from pathlib import Path
from urllib.parse import urlparse

import requests


def extract_playlist_id(s):
    if s.startswith("spotify:playlist:"):
        return s.split(":")[-1]
    if "spotify.com" in s:
        path = urlparse(s).path
        m = re.search(r"/playlist/([A-Za-z0-9]+)", path)
        if m:
            return m.group(1)
    if re.fullmatch(r"[A-Za-z0-9]{22}", s):
        return s
    raise ValueError(f"Could not parse playlist ID from: {s}")


def load_token(config_path):
    """Read access token from the MCP's spotify-config.json.
    The MCP refreshes this automatically when its tools run, so it's
    usually fresh. We let Spotify tell us if it's stale (401)."""
    if not config_path.exists():
        raise SystemExit(
            f"Config not found at {config_path}.\n"
            f"Set up spotify-mcp-server first (run `npm run auth` in its "
            f"repo), then pass the path via --config or SPOTIFY_MCP_CONFIG."
        )
    cfg = json.loads(config_path.read_text())
    token = cfg.get("accessToken")
    if not token:
        raise SystemExit(
            f"No accessToken in {config_path}. Run `npm run auth` in the "
            f"spotify-mcp-server repo first."
        )
    expires_at = cfg.get("expiresAt", 0)
    if expires_at and expires_at < time.time() * 1000:
        print(
            "WARN: MCP token may be expired. If this fails with 401, call "
            "any MCP tool first to force a refresh (or rerun `npm run auth`).",
            file=sys.stderr,
        )
    return token


def http_get(url, token, **params):
    r = requests.get(
        url,
        headers={"Authorization": f"Bearer {token}"},
        params=params or None,
        timeout=15,
    )
    if r.status_code == 401:
        raise SystemExit(
            "Spotify 401: token expired. Call any MCP tool to force refresh, "
            "or rerun `npm run auth` in spotify-mcp-server."
        )
    r.raise_for_status()
    return r.json()


def check_ownership(token, playlist_id):
    me = http_get("https://api.spotify.com/v1/me", token)
    pl = http_get(
        f"https://api.spotify.com/v1/playlists/{playlist_id}",
        token,
        fields="owner.id,name",
    )
    return {
        "is_owner": pl["owner"]["id"] == me["id"],
        "owner_id": pl["owner"]["id"],
        "me_id": me["id"],
        "playlist_name": pl["name"],
    }


def snapshot_current_order(token, playlist_id):
    """Read the current playlist content and return a backup-ready dict.

    Paginates with limit=100 (Spotify API cap, not the MCP's 50)."""
    pl = http_get(
        f"https://api.spotify.com/v1/playlists/{playlist_id}",
        token,
        fields="name,snapshot_id",
    )
    tracks = []
    offset = 0
    while True:
        page = http_get(
            f"https://api.spotify.com/v1/playlists/{playlist_id}/items",
            token,
            limit=100,
            offset=offset,
            fields="items(item(uri,name,artists(name)),track(uri,name,artists(name))),next",
        )
        for i, item in enumerate(page.get("items", [])):
            tr = item.get("item") or item.get("track") or {}
            tracks.append({
                "position": offset + i,
                "uri": tr.get("uri"),
                "title": tr.get("name"),
                "artists": [a.get("name") for a in tr.get("artists", [])],
            })
        if not page.get("next"):
            break
        offset += 100
    return {
        "playlist_id": playlist_id,
        "playlist_name": pl.get("name"),
        "snapshot_id": pl.get("snapshot_id"),
        "captured_at": datetime.datetime.now(datetime.timezone.utc).isoformat(),
        "tracks": tracks,
    }


def write_backup(snapshot, playlist_id):
    """Write backup to /tmp and return its path. REPLACE is destructive,
    so callers should invoke this before replace_tracks."""
    ts = datetime.datetime.now(datetime.timezone.utc).strftime("%Y%m%dT%H%M%SZ")
    path = Path(f"/tmp/spotify-reorder-backup-{playlist_id}-{ts}.json")
    path.write_text(json.dumps(snapshot, indent=2, ensure_ascii=False))
    return path


def replace_tracks(token, playlist_id, uris):
    """Replace playlist content with new URI order.
    Uses the /items endpoint (the /tracks alias returns 403 since the
    March 2026 migration). PUT replaces with up to 100 URIs; for longer
    playlists, PUT first 100 then POST the rest in chunks of 100."""
    head, tail = uris[:100], uris[100:]
    r = requests.put(
        f"https://api.spotify.com/v1/playlists/{playlist_id}/items",
        headers={"Authorization": f"Bearer {token}", "Content-Type": "application/json"},
        json={"uris": head},
        timeout=20,
    )
    if r.status_code == 401:
        raise SystemExit(
            "Spotify 401: token expired. Call any MCP tool to force refresh, "
            "or rerun `npm run auth` in spotify-mcp-server."
        )
    if r.status_code == 403:
        raise SystemExit(
            "Spotify 403: you don't own this playlist. Run with "
            "--check-ownership first, and if not owned, use the MCP's "
            "createPlaylist + addTracksToPlaylist for copy mode instead."
        )
    r.raise_for_status()

    while tail:
        chunk, tail = tail[:100], tail[100:]
        r = requests.post(
            f"https://api.spotify.com/v1/playlists/{playlist_id}/items",
            headers={"Authorization": f"Bearer {token}", "Content-Type": "application/json"},
            json={"uris": chunk},
            timeout=20,
        )
        r.raise_for_status()


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--playlist", required=True, help="Spotify URL or ID")
    parser.add_argument("--order", help="JSON file: list of Spotify URI strings (required unless --check-ownership)")
    parser.add_argument(
        "--config",
        default=os.environ.get("SPOTIFY_MCP_CONFIG"),
        help="Path to spotify-mcp-server's spotify-config.json (or set SPOTIFY_MCP_CONFIG)",
    )
    parser.add_argument(
        "--check-ownership",
        action="store_true",
        help="Print ownership info as JSON, do not modify the playlist",
    )
    args = parser.parse_args()

    if not args.config:
        raise SystemExit(
            "Provide --config or set SPOTIFY_MCP_CONFIG to the path of "
            "spotify-mcp-server/spotify-config.json"
        )

    playlist_id = extract_playlist_id(args.playlist)
    token = load_token(Path(args.config))

    if args.check_ownership:
        result = check_ownership(token, playlist_id)
        print(json.dumps(result, indent=2, ensure_ascii=False))
        return

    if not args.order:
        raise SystemExit("--order is required unless --check-ownership is set")
    new_uris = json.loads(Path(args.order).read_text())
    if not isinstance(new_uris, list) or not all(isinstance(u, str) for u in new_uris):
        raise SystemExit("--order file must be a JSON array of URI strings")

    snapshot = snapshot_current_order(token, playlist_id)
    backup_path = write_backup(snapshot, playlist_id)

    replace_tracks(token, playlist_id, new_uris)

    out = {
        "mode": "in-place",
        "result_playlist_id": playlist_id,
        "result_url": f"https://open.spotify.com/playlist/{playlist_id}",
        "tracks_applied": len(new_uris),
        "backup_path": str(backup_path),
        "backup_snapshot_id": snapshot.get("snapshot_id"),
        "backup_track_count": len(snapshot.get("tracks", [])),
    }
    print(json.dumps(out, indent=2, ensure_ascii=False))


if __name__ == "__main__":
    main()
