# Contract: README section schema

**Feature**: `specs/001-readme-coverage-cost/`
**Date**: 2026-05-18

Defines the required shape of each new or modified README section. The
intent is that a reviewer can verify the README against this contract
in under a minute without re-reading the spec.

---

## Section: Use cases (new)

**Anchor heading**: `## Use cases`
**Position**: after `## What's in the box`, before `## What's been validated`.

**Required content**:

- Intro line (≤ 200 chars) stating what these are ("Three reorder
  intents the tool has been validated end-to-end on.") and what they
  are NOT ("Aspirations and untested workflows live in 'What's been
  validated'.").
- Exactly **3** entries (per R3).
- Each entry MUST be a bullet or short paragraph with:
  - `catalog_style` in bold.
  - The `user_intent` in italics or quotes.
  - One sentence (`outcome_summary`).

**Required link**: each entry MUST include a relative link to its
underlying run record under `specs/001-readme-coverage-cost/runs/`.

**Forbidden phrases**: "should work for", "would also work", "in theory",
"any genre" — anything that suggests un-validated coverage.

**Example shape** (not normative content):

```markdown
## Use cases

Three intents validated end-to-end. Untested catalogs live in
"What's been validated" below.

- **House** — *"build a 90-min peak-time set"* — produced a coherent
  arc with usable Camelot transitions.
  [run record](./specs/001-readme-coverage-cost/runs/house-2026-04-15.md)
- **MPB** — *"sessão contemplativa, MPB pós-2000"* — [outcome].
  [run record](./specs/001-readme-coverage-cost/runs/mpb-YYYY-MM-DD.md)
- **[genre family]** — *"[intent]"* — [outcome].
  [run record](./specs/001-readme-coverage-cost/runs/[slug].md)
```

---

## Section: What's been validated (new)

**Anchor heading**: `## What's been validated`
**Position**: after `## Use cases`, before `## Expected cost`.

**Required content**:

- Intro line stating the dual axis: objective (workflow ran, write
  succeeded) vs subjective (sequencing musically coherent).
- A Markdown table with columns:
  `| Genre | Objective | Subjective | Notes |`
- At least 3 rows. At least one row MUST have `Objective: not run` —
  this is the spec's "what we haven't tested" honesty requirement
  (FR-002).

**Cell content rules**:

- `Objective`: `✅ passed`, `❌ failed (mechanical)`, or `not run`.
- `Subjective`: `✅ coherent`, `⚠️ partial`, `❌ incoherent`, `not rated`,
  or `n/a` (if Objective failed).
- `Notes`: sub-styles tested, failure mode if any, sample size.

**Forbidden**: empty cells, "TBD", "coming soon". Every row is a
factual claim now.

---

## Section: Expected cost (new)

**Anchor heading**: `## Expected cost`
**Position**: after `## What's been validated`, before `## Requirements`.

**Required content**:

- Methodology paragraph (≤ 250 chars) stating: numbers recorded from
  Claude Code session totals, per R2, with link to issue #4 noting
  that per-run visibility inside the skill output is tracked there.
- A Markdown table with columns:
  `| Playlist size | Total tokens (range) | Per-track avg | Methodology |`
- Exactly **3** rows: `≤ 30 tracks`, `31–100 tracks`, `101+ tracks`
  (per R6).
- A closing line stating per-track scaling is roughly linear because
  enrichment runs per-track.

**Cell content rules**:

- `Total tokens (range)`: `low–high` integers, sourced from recorded
  runs. NEVER include the band if `runs_underpinning` would be empty.
- `Per-track avg`: integer, computed.
- `Methodology`: `single-run` / `single-run + per-track extrapolation`
  / `averaged-N-runs`. No other values.

**Forbidden**: round-number ranges that don't trace to a run
(`~10000`, `≈ 5000`); per-band TBD; estimated costs without a
methodology label.

---

## Section: Feedback (new)

**Anchor heading**: `## Feedback`
**Position**: after `## Privacy and data`, before `## Troubleshooting`.

**Required content**:

- Intro line explicitly stating two categories of feedback are welcome
  (mechanical and musical), and that musical feedback is the harder,
  more-valued kind (FR-004).
- Exactly **2** subsections or bullet rows:
  - **Mechanical issues** — title prefix `[bug]`, body includes
    install/auth context, error output, OS/Node/Python versions if
    relevant.
  - **Musical-quality concerns** — title prefix `[musical]`, body
    includes the playlist link (if shareable), original intent, and
    one paragraph on what felt wrong. Tone MUST be explicitly
    welcoming.

**Required link**: GitHub issues URL for `demasir/spotify-set-reorder`.

**Forbidden**: any wording that asks the user to choose between
multiple destinations (Issues vs Discussions vs Forms — per R4 there
is only one destination).

---

## Section: Install (modified)

**Anchor heading**: `## Install` (heading text may drop the existing
"(one-liner)" qualifier — both install paths exceed one line).
**Position**: keep current position in the file (after `## Requirements`,
before `## First-run setup`).

**Required content**:

- A one-line intro stating that two install paths are available and
  both are tested.
- Two clearly-labeled sub-blocks rendered side-by-side or stacked with
  equal visual weight. Neither is hidden behind a collapsible or
  presented as the "advanced" alternative.

### Sub-block A — Slash-command install (copy-paste)

**Required form**:

```text
/plugin marketplace add https://github.com/demasir/spotify-set-reorder
/plugin install spotify-set-reorder@<marketplace-name>
```

- `<marketplace-name>` MUST match the `name` field in
  `.claude-plugin/marketplace.json` at publish time (per R10/R11,
  working assumption `spotify-tools`).
- The two commands MUST be presented in an unambiguous code block
  that the user can copy as a unit.
- A one-sentence note follows confirming this is the recommended path
  for users on a recent Claude Code build.

### Sub-block B — UI walkthrough (existing flow)

**Required form**: an ordered list of 3 steps:

1. Open the plugins UI in Claude Code (`/plugin` → **Marketplaces** →
   **Add**).
2. Paste the repo URL: `https://github.com/demasir/spotify-set-reorder`.
3. Switch to the **Plugins** tab → install `spotify-set-reorder`.

This sub-block's content is materially what the current README's
`## Install (one-liner)` section already says; preserving it is
required by the fallback clause of FR-012.

### Verification clause (visible to readers)

The Install section MUST include a footnote or end-of-section line
stating that both paths were verified end-to-end from a fresh Claude
Code session on the README's publish date. This is the reader-facing
manifestation of SC-007's verification requirement — Principle II's
posture applied to install instructions.

### Forbidden in the Install section

- A "(coming soon)" badge on either sub-block.
- Presenting one path as primary and the other as a footnote /
  collapsible / appendix — both have equal weight (FR-012).
- An install string that uses the OLD marketplace name
  (`spotify-set-reorder@spotify-set-reorder`). Once the rename
  (FR-013) lands, the README MUST reflect the new name.

---

## Section: Tagline / pitch (modified)

**Anchor heading**: `# spotify-set-reorder` (the H1 itself stays).
**Position**: top of file.

**Required edit**:

- Remove or replace the phrase **"Works for any genre"** (and any
  equivalent unqualified-generality wording) per FR-005 and SC-004.
- Replace with language that points the reader at "What's been
  validated" for the actual coverage report. Example phrasing:
  *"Designed to be genre-agnostic — see 'What's been validated' below
  for the catalogs it has actually been demonstrated on."*

**Preserved**: everything else in the tagline / pitch paragraph.

---

## Sections NOT modified (preservation list)

Per FR-006, these sections retain their current factual content. Light
copy-editing for flow is permitted; structural or substantive change is
not.

- `## What's in the box`
- `## Requirements`
- `## First-run setup (~90 seconds)`
- `## Use`
- `## How it works`
- `## Privacy and data`
- `## Troubleshooting`
- `## Contributing`
- `## License`

A reviewer can grep for these headings in the diff; the body of each
should be ≥ 90% unchanged.

### Note on `## Install`

Removed from the preservation list. The Install section is modified
per FR-012 (slash-command + UI walkthrough side-by-side with equal
weight) and is the subject of a dedicated schema above (`## Section:
Install (modified)`). The current `## Install (one-liner)` body
content survives as Sub-block B of the new schema; it is not
discarded.
