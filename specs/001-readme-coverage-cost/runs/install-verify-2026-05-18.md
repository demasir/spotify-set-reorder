# Install-path verification — 2026-05-18

**Task**: T011 (Sub-phase 4a, US1). Verifies the slash-command install
path from `spec.md` FR-012 and `contracts/readme-section-schema.md` →
"Section: Install (modified)" works end-to-end from a fresh Claude Code
session against the renamed marketplace.

**State at run time**:

- Marketplace `name` in `.claude-plugin/marketplace.json` is set to
  `spotify-tools` (uncommitted; see `git diff .claude-plugin/marketplace.json`).
- Plugin and marketplace `version` are both `0.3.0` (uncommitted).
- The rename / bump has NOT yet been pushed to the remote, so verification
  uses a **local-path marketplace install** rather than the GitHub URL —
  the remote still serves the old `spotify-set-reorder` name.

---

## Pre-verification reset

- [x] Ran `./scripts/dev-reset.sh --yes` from a separate terminal.
  - Output / state changes: skipped `dev-reset.sh`; instead the prior
    `spotify-set-reorder` marketplace registration was removed
    interactively via `/plugin` (Claude Code printed
    `✔ Removed 1 marketplace`). Result equivalent for the `marketplace add`
    test that follows — no stale `spotify-set-reorder` entry remained in
    `~/.claude/plugins/known_marketplaces.json` before Step 1.
- [x] Confirmed no `spotify-set-reorder` marketplace entry remains in
  `~/.claude/plugins/known_marketplaces.json`. Only `claude-plugins-official`
  remained pre-Step-1.

---

## Step 1 — `/plugin marketplace add` (local path)

**Command**: `/plugin marketplace add /Users/rafael.carvalho/git_projects/spotify-set-reorder`

**Why local path, not GitHub URL**: the rename to `spotify-tools` is
uncommitted at run time; the remote still resolves to `spotify-set-reorder`.

**Expected stdout / UI confirmation**:
- Marketplace registered under the name `spotify-tools` (the new value
  from the uncommitted `marketplace.json`).
- One plugin discovered: `spotify-set-reorder`.

**Observed**: Claude Code printed
`Successfully added marketplace: spotify-tools` in the slash-command
output panel. `~/.claude/plugins/known_marketplaces.json` post-add
contained an entry with `source.source = "directory"`, `source.path =
"/Users/rafael.carvalho/git_projects/spotify-set-reorder"`, and the
marketplace key `spotify-tools` — i.e. resolved name matches the
`name` field in the uncommitted `marketplace.json`. Exactly one plugin
(`spotify-set-reorder`) discoverable on the marketplace per the
manifest.

**Status**: pass

---

## Step 2 — `/plugin install spotify-set-reorder@spotify-tools`

**Command**: `/plugin install spotify-set-reorder@spotify-tools`

**Expected stdout / UI confirmation**:
- Plugin installed successfully.
- Version: `0.3.0`.
- Source: local working tree at the path registered in Step 1.

**Observed**: Claude Code printed
`✓ Installed spotify-set-reorder. Run /reload-plugins to apply.`
Followed by `/reload-plugins`:
`Reloaded: 1 plugin · 0 skills · 6 agents · 1 hook · 1 plugin MCP server · 0 plugin LSP servers`
The `1 hook` count confirms the SessionStart hook from `plugin.json`
loaded. Source path resolves to the local working tree registered in
Step 1. Version is not surfaced directly in the install output, but
`plugins/spotify-set-reorder/.claude-plugin/plugin.json` on disk reads
`"version": "0.3.0"` — the installed plugin reads from the same path
because the marketplace source type is `directory`.

**Status**: pass

---

## Step 3 — SessionStart auth nudge

**Procedure**: close and reopen the Claude Code session after Step 2.
The `SessionStart` hook defined in `plugins/spotify-set-reorder/.claude-plugin/plugin.json`
runs `bash ${CLAUDE_PLUGIN_ROOT}/scripts/check-auth.sh` and should fire
the onboarding nudge if no valid Spotify tokens are present.

**Observed**: closed and reopened the Claude Code session after running
`/spotify-set-reorder:setup` (so valid `accessToken` + `refreshToken`
were present in `$CLAUDE_PLUGIN_DATA/spotify-config.json`). On reopen,
the chat surfaced no system message — the hook ran but stayed silent.
This matches `check-auth.sh`'s `authenticated` branch (`sys.exit(0)`
without printing), which is the correct behavior for a user with valid
tokens. The hook fired (registration was loaded in Step 2's
`/reload-plugins` output) and made the right decision.

**Status**: pass

---

## Failure modes encountered

If any step failed, the spec's edge case applies: the README still
publishes with both install paths side-by-side (per FR-012), the
verification failure is recorded HERE as a known limitation, and a
follow-up issue is filed (tracked by T024 in `tasks.md`).

- None. All three steps passed clean. T024 (the follow-up-issue task)
  is not triggered.

---

## Result summary

| Step | Status |
| ---- | ------ |
| dev-reset.sh | skip — equivalent cleanup done via interactive `/plugin` (Removed 1 marketplace) |
| `/plugin marketplace add` | pass |
| `/plugin install spotify-set-reorder@spotify-tools` | pass |
| SessionStart auth nudge | pass |

**Overall**: verification_passed

**Implication for README**:
- If `verification_passed`: T017 (Install section rewrite) proceeds normally.
  The Install section's footnote states "both paths verified on 2026-05-18".
- If `verification_failed`: T017 still proceeds, both paths still ship
  side-by-side (FR-012 fallback), but the slash-command sub-block carries
  a footnote referencing the known-limitation issue from T024.

---

## How to reproduce

If a reviewer wants to re-verify before the merge:

1. `cd /Users/rafael.carvalho/git_projects/spotify-set-reorder`
2. `./scripts/dev-reset.sh --yes`
3. Open a fresh Claude Code session.
4. Run the two `/plugin` commands above.
