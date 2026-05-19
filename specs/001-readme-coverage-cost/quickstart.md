# Quickstart: executing this feature

**Feature**: `specs/001-readme-coverage-cost/`
**Date**: 2026-05-18

This is the runbook for the maintainer (you) to execute the feature.
It assumes `spec.md`, `plan.md`, `research.md`, `data-model.md`, and
the two contract files exist (they do — that's this command's output)
and that `/speckit-tasks` has not yet run.

The work is two phases — validation runs first (because the data they
produce is what makes the README honest), then the README rewrite.

---

## Prerequisites (one-time, takes ~2 minutes)

- [ ] You are on branch `001-readme-coverage-cost`.
- [ ] The plugin is installed and `/spotify-set-reorder:setup` has been
      run successfully on this machine (your existing setup is fine —
      you don't need a fresh OAuth).
- [ ] You have access to two playlists for the validation runs:
  - One **MPB** playlist (canonical "BPM-as-constraint" case).
  - One **non-electronic, non-MPB** playlist (rock / jazz / hip-hop /
    samba / other — your call when you schedule the run).
- [ ] You have a Spotify Premium account (required for Spotify
      Developer Mode API access since March 2026 — already satisfied
      if the existing setup works).

---

## Phase A — Validation runs (Story 2; gating)

### A.1 Run the MPB validation

1. **Pick a playlist** with ~20–40 tracks and a clear "contemplative"
   center of gravity. Smaller is fine; larger increases token cost
   without proportionally more signal.
2. **Pick the intent** — something concrete like
   *"sessão contemplativa, MPB pós-2000"* or
   *"transição entre tarde e noite, MPB acústica"*. Match what a real
   user might ask.
3. **Invoke the skill**: `/spotify-set-reorder` and paste the
   playlist URL + intent. Walk through all 9 checkpoints normally.
   Do NOT intervene to "improve" the result — the run is meant to
   measure what the skill produces unaided.
4. **Confirm the skill defaulted to new-playlist mode** (Principle IV).
   In-place mutation during validation is forbidden.
5. **At the end of the run**, before closing the Claude Code session,
   check the session UI for the total token consumption number.
   Record it.
6. **Write the run note** at
   `specs/001-readme-coverage-cost/runs/mpb-<YYYY-MM-DD>.md` following
   the contract in `contracts/validation-run-schema.md`. The
   `data_provenance` counts come from the enrichment step's per-track
   `source` field — sum them. The check is that they sum to
   `input_track_count`.
7. **Form your subjective verdict honestly**. If the result was poor,
   record `partial` or `incoherent`. Negative outcomes are valuable
   data (see R8).
8. **Commit the run note** with a message like
   `docs(validation): MPB run — <verdict>`.

### A.2 Run the non-electronic, non-MPB validation

Same steps, different playlist. The genre family is your choice when
you schedule the run; whatever you pick goes in the README's "Use
cases" entry #3.

Pick the playlist size with the same ~20–40 range bias. If the
catalog you have access to is materially larger, that's fine — record
the actual track count.

Write the run note to
`specs/001-readme-coverage-cost/runs/<genre>-<YYYY-MM-DD>.md`.

### A.3 (Optional but recommended) Backfill a house run note

The house genre family is already validated qualitatively, but no
formal run note exists in this feature's `runs/` directory. To keep
the README's three "Use cases" entries each pointing at a run record,
write one retrospective note for a recent house run you remember
clearly. Use `partial` recollection annotations if needed (e.g.,
`tokens_observed: ~28000 (retrospective, approximate)`); flag the
retrospective nature in the run note's "How tokens were counted"
section.

Path: `specs/001-readme-coverage-cost/runs/house-<YYYY-MM-DD>.md`.

If you'd rather omit the house run record entirely, the README's
"Use cases" entry for house simply links to the relevant section of
"What's been validated" instead of a run record. Document the choice
in the README rewrite PR.

---

## Phase B — README rewrite (Story 1)

With the run notes committed, the README's three new sections each
have factual content to draw from. Now you can edit the README in
place.

### B.1 Tagline edit

- [ ] Open `README.md`.
- [ ] Find and remove the phrase **"Works for any genre"** and any
      equivalent unqualified-generality claim (FR-005, SC-004).
- [ ] Replace with language pointing readers at the new "What's been
      validated" section (see
      `contracts/readme-section-schema.md` → "Section: Tagline /
      pitch (modified)").

### B.2 Insert the three new sections

Place them in this order, between `## What's in the box` and
`## Requirements` (per R5):

1. `## Use cases` — populated from your 3 run records.
2. `## What's been validated` — table with ≥ 3 rows. House and the
   two new runs are the minimum; at least one row MUST be labeled
   `not run` (FR-002).
3. `## Expected cost` — three cost bands per R6, each backed by
   `runs_underpinning` from your run records.

Each section's required shape is in
`contracts/readme-section-schema.md`. Use the example shapes there as
starting points; do not copy them as final content.

### B.2.5 Verify the slash-command install path, then rewrite the Install section

This step is gating for SC-007. Do not skip even if the commands "look
right" — verification is the point.

1. **Rename the marketplace first** (Phase C does the formal bump
   commit, but the verification needs the new name in place to work):
   - Edit `.claude-plugin/marketplace.json` and change `name` from
     `spotify-set-reorder` to the chosen marketplace name (working
     assumption `spotify-tools`; final pick per R11).
   - Do NOT commit yet — verify first, then bundle the rename + bump
     in Phase C.
2. **Open a fresh Claude Code session**, with no prior
   `spotify-set-reorder` marketplace registration. If your machine
   already has it registered (from your own dev/testing), run
   `./scripts/dev-reset.sh` to wipe the plugin's local state, OR run
   `/plugin marketplace remove spotify-set-reorder` (the old name)
   in Claude Code first.
3. **Run the two commands**:
   ```
   /plugin marketplace add https://github.com/demasir/spotify-set-reorder
   /plugin install spotify-set-reorder@<marketplace-name>
   ```
   where `<marketplace-name>` is the value you just set in
   `marketplace.json`. **Note**: until the rename commit lands on the
   remote, the marketplace name resolved from the remote will be the
   OLD one. You may want to run this verification from a local-path
   marketplace install instead: `/plugin marketplace add <local-path>`
   pointing at this working tree. Document whichever you did in the
   run note below.
4. **Record the outcome** in a short note at
   `specs/001-readme-coverage-cost/runs/install-verify-<YYYY-MM-DD>.md`
   with:
   - Each command + stdout/UI confirmation.
   - Whether the SessionStart auth-nudge fired correctly on next
     session.
   - Any failure mode (and you fall back to side-by-side publish per
     the spec's edge case).
5. **Update the README's Install section** per the contract in
   `contracts/readme-section-schema.md` → "Section: Install (modified)":
   slash-command sub-block + UI-walkthrough sub-block side-by-side,
   both labeled, plus the verification-date footnote.
6. **Recheck**: the install string in the README MUST use the new
   marketplace name. Grep the README for the old
   `spotify-set-reorder@spotify-set-reorder` and confirm it does not
   appear.

### B.3 Insert the Feedback section

Place between `## Privacy and data` and `## Troubleshooting` (per R5).
Two subsections: mechanical (`[bug]` prefix) and musical (`[musical]`
prefix). Tone for the musical subsection is explicitly welcoming —
re-read FR-004's wording before you write it.

### B.4 Sanity sweep

- [ ] Self-run Story 1's Independent Test: a reader who has never used
      this can answer **five** questions from the README alone in under
      three minutes (use cases, untested genres, cost band for a
      50-track playlist, feedback channel, *and* "install in ≤ 2
      copy-pasteable commands"). Read it cold; if any of the five
      answers is hard to find, that section needs reshaping.
- [ ] Grep the README for forbidden phrases listed in the section
      schema ("works for any", "should work", "would also work", "in
      theory", "TBD", "coming soon"). None should remain.
- [ ] Confirm preserved sections (Setup / Use / Privacy /
      Troubleshooting / Contributing / License) are ≥ 90% unchanged in
      body content (FR-006). Install is *modified*, not preserved, and
      follows the dedicated schema.
- [ ] Confirm the install string in the README uses the new
      marketplace name, not the old `spotify-set-reorder` value.

---

## Phase C — Marketplace rename + version bump (gating; R9, R11, SC-008)

This is **mandatory**, not advisory. The marketplace rename breaks
existing user registrations; the version bump is the user-facing
signal.

- [ ] Confirm `.claude-plugin/marketplace.json` `name` field is set
      to the new marketplace name (working assumption `spotify-tools`;
      you may have already done this in B.2.5).
- [ ] Bump `.claude-plugin/marketplace.json` `version` from `0.2.2`
      to **`0.3.0`** (MINOR in 0.x — see R11).
- [ ] Bump `plugins/spotify-set-reorder/.claude-plugin/plugin.json`
      `version` to **`0.3.0`** as well (Principle V's sync rule).
- [ ] Commit both files together with a message like:
      `chore: bump to v0.3.0 — marketplace rename + README rewrite`.
- [ ] Draft the release-notes paragraph for affected users (per
      R11 / SC-008). Put it in the PR description and, when the
      release is cut, in the GitHub release body:

      > **0.3.0 — marketplace rename**
      >
      > The marketplace name has changed from `spotify-set-reorder`
      > to `spotify-tools`. If you installed an earlier version,
      > your local marketplace registration will not receive
      > updates from the new name. To pick them up, run
      > `/plugin marketplace remove spotify-set-reorder` once,
      > then re-add the marketplace via the new install path
      > documented in the README. Your existing plugin install and
      > your `/spotify-set-reorder:setup` tokens are NOT affected.

---

## Phase D — Merge

- [ ] Open / update PR #5 with the new commits.
- [ ] In the PR description, link the run records (including the
      install-verification note from B.2.5) and the "What's been
      validated" table.
- [ ] In the PR description, include the release-notes paragraph
      drafted in Phase C so it's visible to anyone reviewing the
      change.
- [ ] Reviewer's job: verify the README against
      `contracts/readme-section-schema.md`, confirm each cost-band
      number traces to a `runs_underpinning` reference, and confirm
      the install string uses the new marketplace name.

After merge:
- [ ] **Issue #3** can be closed referencing the merge commit.
- [ ] **Issue #4** stays open as the deferred token-visibility work.
- [ ] Cut the **0.3.0** release on GitHub, pasting the release-notes
      paragraph from Phase C into the release body.
- [ ] **CLAUDE.md SPECKIT-markers update**: small follow-up commit on
      `main` to add `<!-- SPECKIT START -->` / `<!-- SPECKIT END -->`
      markers around a reference to this plan, so future
      `/speckit-plan` runs can update it automatically (per
      `plan.md` → "Agent Context Update").
- [ ] Optional: post a short note in any community channel where the
      plugin was previously announced, repeating the migration
      instruction for affected users.

---

## What this quickstart does NOT cover

- Token visibility in skill output → tracked at #4.
- Localization (Portuguese README) → Q1 resolved to English-only;
  separate feature if revisited.
- Skill body changes → none in this feature.
- MCP changes → none.
- Test automation → none added; validation is by manual run, README
  acceptance is by reader test.
