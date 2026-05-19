# Contract: Validation run record schema

**Feature**: `specs/001-readme-coverage-cost/`
**Date**: 2026-05-18
**Mirrors**: Entity 5 in `../data-model.md`.

A validation run record is a Markdown file under
`specs/001-readme-coverage-cost/runs/` documenting one end-to-end skill
run. The README's "Use cases", "What's been validated", and "Expected
cost" sections are derived from these records. This contract defines
their required shape so any reviewer can spot a missing field at a
glance.

---

## File location and naming

**Path**: `specs/001-readme-coverage-cost/runs/<run_id>.md`

**Naming convention**: `<genre-slug>-<YYYY-MM-DD>.md`. Examples:
`house-2026-04-15.md`, `mpb-2026-05-22.md`, `rock-2026-05-23.md`.

**Immutability**: once committed, a run record is not edited
in-place. Corrections happen as a new record cross-referenced in the
new record's `surprises` field.

---

## Required front matter

The file begins with a YAML front-matter block:

```yaml
---
run_id: <slug matching filename>
run_date: <YYYY-MM-DD>
genre_family: <high-level family, e.g., "house" / "MPB" / "rock">
sub_styles: [<list of strings>, optional]
input_playlist_url: <Spotify URL>
input_track_count: <integer>
user_intent: <natural-language goal passed to the skill>
output_playlist_url: <Spotify URL or "n/a">
objective_outcome: <passed | failed_mechanical>
subjective_verdict: <coherent | partial | incoherent | not_rated>
tokens_observed: <integer>
tokens_source: claude-code-session-ui
data_provenance:
  websearch: <integer>
  partial: <integer>
  estimated: <integer>
  unknown: <integer>
---
```

**Validation**: `data_provenance.websearch + .partial + .estimated +
.unknown` MUST equal `input_track_count`. Mismatch → invalid record →
rerun.

---

## Required body sections

Below the front matter, three Markdown sections in this order:

### `## Subjective notes`

One paragraph (≤ 500 chars). MUST name *what worked* and *what didn't*.
"It was fine" is not acceptable; the maintainer must surface the
sequencing decisions that landed well and the ones that didn't.

### `## Surprises`

Optional. Empty section header is fine if nothing was surprising. If
present, free-text bullet list. Cross-references to other run records
(after re-runs) go here.

### `## How tokens were counted`

One paragraph stating the source of `tokens_observed`. For now, always
"Recorded from the Claude Code session UI at the moment the skill's
final step completed." Updates when issue #4 ships.

---

## Forbidden content

- **Fabricated numbers**: any BPM, key, or token-consumption value not
  observed must NOT appear. This is Principle II as enforced by this
  feature.
- **Aspirational claims**: "would also work for X" — the record is
  about *this run*, not extrapolation.
- **In-place edits after commit**: once on a branch's HEAD, treat the
  record as immutable.

---

## Example shape (not normative content)

```markdown
---
run_id: mpb-2026-05-22
run_date: 2026-05-22
genre_family: MPB
sub_styles: ["MPB pós-2000"]
input_playlist_url: https://open.spotify.com/playlist/[id]
input_track_count: 28
user_intent: "sessão contemplativa, MPB pós-2000"
output_playlist_url: https://open.spotify.com/playlist/[new-id]
objective_outcome: passed
subjective_verdict: partial
tokens_observed: 47000
tokens_source: claude-code-session-ui
data_provenance:
  websearch: 18
  partial: 6
  estimated: 3
  unknown: 1
---

## Subjective notes

The opening arc held together — three slower tracks with shared mood
landed as a coherent intro. The middle stretch lost focus when two
post-2010 tracks were sequenced against a 1990s anchor; the rhythmic
contrast worked harmonically but broke the contemplative thread the
intent asked for. The closer was correct.

## Surprises

- Tunebat had nothing for two tracks; LLM estimation guessed key
  signatures that turned out to be a half-step off in one case,
  caught manually during the checkpoint review.

## How tokens were counted

Recorded from the Claude Code session UI at the moment the skill's
final step completed. Session was fresh (no prior context).
```
