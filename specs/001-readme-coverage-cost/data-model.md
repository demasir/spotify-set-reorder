# Phase 1 Data Model: Honest README

**Feature**: `specs/001-readme-coverage-cost/`
**Date**: 2026-05-18
**Inputs**: `spec.md` (Key Entities section), `research.md` (decisions
R3, R6, R7)

This feature's "data" is editorial content plus validation-run records.
The entities below describe the shape of that content so the README
sections render consistently and the run notes are diff-able.

---

## Entity 1: Use case

A validated reorder run that appears in the README "Use cases" section.

| Field             | Type      | Required | Notes                                                                                   |
| ----------------- | --------- | -------- | --------------------------------------------------------------------------------------- |
| `catalog_style`   | string    | yes      | High-level genre or style descriptor (e.g., "house", "MPB", "rock").                    |
| `user_intent`     | string    | yes      | The natural-language goal that was passed to the skill (≤ 120 chars in the README).     |
| `outcome_summary` | string    | yes      | One-sentence subjective outcome (≤ 200 chars).                                          |
| `run_ref`         | string    | yes      | Path to the recording validation run under `specs/001-readme-coverage-cost/runs/`.      |
| `run_date`        | ISO date  | yes      | Date the run was executed (YYYY-MM-DD).                                                 |

**Cardinality in README**: exactly 3 entries at first publish (per R3).

**Source of truth**: the corresponding *Validation run record* (Entity 5)
under `runs/`. The README entry is a derived summary; the run record
holds the full data.

---

## Entity 2: Genre validation entry

A row in the README "What's been validated" table.

| Field                 | Type    | Required | Notes                                                                                                                |
| --------------------- | ------- | -------- | -------------------------------------------------------------------------------------------------------------------- |
| `genre`               | string  | yes      | High-level family (one row per family per R7; sub-styles go in `notes`).                                             |
| `objective_verdict`   | enum    | yes      | `passed` / `failed_mechanical` / `not_run`. Did the workflow run and the write succeed?                              |
| `subjective_verdict`  | enum    | yes      | `coherent` / `partial` / `incoherent` / `not_rated` / `n/a`. Maintainer's judgment of the sequencing quality.        |
| `notes`               | string  | yes      | Free text. Sub-styles tested, failure modes if any, sample size.                                                     |
| `run_refs`            | list    | optional | Path(s) to underlying run record(s). Optional for pre-existing house runs that may not have a formal run note yet.   |

**Cardinality in README**: at least 3 rows at first publish (house +
MPB + non-electronic non-MPB); at least one row MUST be labeled
`not_run` to satisfy FR-002.

---

## Entity 3: Cost band

A row in the README "Expected cost" section.

| Field               | Type      | Required | Notes                                                                            |
| ------------------- | --------- | -------- | -------------------------------------------------------------------------------- |
| `playlist_size`     | string    | yes      | Band label (e.g., "≤ 30 tracks", "31–100", "101+"). Per R6.                       |
| `tokens_total_low`  | integer   | yes      | Lower bound of observed total token consumption across recorded runs.            |
| `tokens_total_high` | integer   | yes      | Upper bound.                                                                     |
| `tokens_per_track`  | integer   | yes      | Average per-track token consumption (computed: total / track count).             |
| `methodology`       | enum      | yes      | `single-run` / `single-run + per-track extrapolation` / `averaged-N-runs`.       |
| `runs_underpinning` | list[str] | yes      | run_refs that contributed to this band's numbers. Empty list is forbidden.       |

**Cardinality in README**: exactly 3 rows at first publish (per R6).

**Validation rule**: If `runs_underpinning` is empty, the cost band
MUST NOT be published. Estimates without recorded runs violate
SC-003.

---

## Entity 4: Feedback channel

A row in the README "Feedback" section.

| Field                | Type   | Required | Notes                                                                                              |
| -------------------- | ------ | -------- | -------------------------------------------------------------------------------------------------- |
| `category`           | enum   | yes      | `mechanical` / `musical`. Exactly two rows per R4.                                                 |
| `destination`        | string | yes      | URL (GitHub Issues link).                                                                          |
| `title_prefix`       | string | yes      | Copy-pasteable prefix: `[bug]` for mechanical, `[musical]` for musical.                            |
| `expected_body`      | string | yes      | Markdown bullet list of what to include in the issue body.                                         |
| `invitation_tone`    | enum   | yes      | `welcoming` / `welcoming-and-explicit`. The `musical` row MUST be `welcoming-and-explicit` per FR-004. |

**Cardinality in README**: exactly 2 rows.

---

## Entity 5: Validation run record

A file under `specs/001-readme-coverage-cost/runs/` documenting one
end-to-end execution of the skill against one catalog. This is the
*evidence* behind Entities 1–3.

| Field                  | Type      | Required | Notes                                                                                                                  |
| ---------------------- | --------- | -------- | ---------------------------------------------------------------------------------------------------------------------- |
| `run_id`               | string    | yes      | Slug, e.g., `mpb-2026-05-22` or `rock-2026-05-23`. Matches filename.                                                   |
| `run_date`             | ISO date  | yes      | YYYY-MM-DD.                                                                                                            |
| `genre_family`         | string    | yes      | One of the genre families used in Entity 2.                                                                            |
| `sub_styles`           | list[str] | optional | E.g., `["MPB pós-2000"]`.                                                                                              |
| `input_playlist_url`   | URL       | yes      | Spotify playlist link used as input.                                                                                   |
| `input_track_count`    | integer   | yes      | Number of tracks in the input playlist.                                                                                |
| `user_intent`          | string    | yes      | The natural-language goal passed to the skill.                                                                         |
| `output_playlist_url`  | URL       | optional | Spotify link to the new playlist (the skill defaults to new-playlist mode per Principle IV).                            |
| `objective_outcome`    | enum      | yes      | `passed` / `failed_mechanical`. Did the workflow run end-to-end?                                                       |
| `subjective_verdict`   | enum      | yes      | `coherent` / `partial` / `incoherent` / `not_rated`. Maintainer's judgment.                                            |
| `subjective_notes`     | string    | yes      | One-paragraph reasoning for the verdict. Must name *what worked* and *what didn't*.                                    |
| `tokens_observed`      | integer   | yes      | Session-level token consumption recorded at run end (per R2).                                                          |
| `tokens_source`        | enum      | yes      | `claude-code-session-ui` / `other`. For now always the first (per R2; updates after #4 ships).                          |
| `data_provenance`      | object    | yes      | Counts of tracks whose BPM/key came from `websearch` / `partial` / `estimated` / `unknown`. Enforces Principle II.    |
| `surprises`            | string    | optional | Anything unexpected: a track the enrichment missed, a transition that worked against expectation, etc.                 |

**Validation rule** (enforces Principle II): `data_provenance` MUST sum
to `input_track_count`. If the four counts don't sum to the total
track count, the run note is invalid and the run MUST be re-recorded.

---

## Relationships

```text
Validation run record (5) ──underpins──> Use case (1)
                          │
                          ├──underpins──> Genre validation entry (2)
                          │
                          └──underpins──> Cost band (3)

Feedback channel (4)  (standalone — no run dependency)
```

A single validation run record can underpin multiple README entities
(one run → one use case + one genre row + a contribution to one cost
band). That's why the run record is the system of record and the
README rows are derived.

---

## State transitions

The only stateful entity is **Validation run record**:

```
draft  ──run executed──>  recorded
recorded  ──re-run after mechanical failure──>  recorded (new file, prior linked from `surprises`)
recorded  ──Principle II violation (provenance counts mismatch)──>  invalid → must rerun
```

A `recorded` validation run record is immutable once committed.
Corrections happen as new files with cross-references in `surprises`,
not in-place edits.
