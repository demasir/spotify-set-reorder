# Implementation Plan: Honest README — Use Cases, Limitations, Cost, Feedback

**Branch**: `001-readme-coverage-cost` | **Date**: 2026-05-18 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/001-readme-coverage-cost/spec.md`

## Summary

Rewrite `README.md` so a first-time reader can answer **five** questions
in under three minutes — concrete use cases the tool has been validated
on, genres / contexts it has *not* been validated on, expected token
cost for their playlist size, where to send feedback (mechanical vs.
musical), **and how to install in two copy-pasteable commands**.

The work is mostly editorial, plus three concrete non-editorial pieces:

1. Run the skill end-to-end on at least one MPB playlist and one
   non-electronic non-MPB playlist so the "What's been validated" and
   "Expected cost" sections are reports rather than speculation
   (FR-007, FR-008).
2. Rename the marketplace from `spotify-set-reorder` to a name
   distinct from the plugin name (working assumption: `spotify-tools`)
   so the slash-command install path reads cleanly as
   `spotify-set-reorder@spotify-tools` rather than the awkward
   self-duplicating `spotify-set-reorder@spotify-set-reorder`
   (FR-013, SC-008). Bumps `0.2.2 → 0.3.0`.
3. Verify both install paths (slash-command + UI walkthrough) work
   end-to-end from a fresh Claude Code session before merge (FR-012,
   SC-007).

No skill body changes, no MCP changes, no Python helper changes. Story
3 (token visibility inside the skill output) is out of scope per Q2 —
tracked at
[#4](https://github.com/demasir/spotify-set-reorder/issues/4).

## Technical Context

This is a documentation-and-validation feature, not a software feature.
Standard "Language/Version, Primary Dependencies, Testing" fields adapt
to that:

**Artifact languages**: Markdown (README.md). Existing Bash and Python
scripts are not modified.

**Primary Dependencies**: The existing plugin runtime — Claude Code's
skill dispatcher, the bundled MCP server, and `apply_reorder.py` — is
consumed by the validation runs but not modified. The runs themselves
depend on the Spotify Web API (read/modify the maintainer's own playlists)
and Claude Code's built-in WebSearch (BPM/key enrichment).

**Storage**: All artifacts produced by this feature live in three places:
- `README.md` at repo root (the rewrite target).
- `.claude-plugin/marketplace.json` and
  `plugins/spotify-set-reorder/.claude-plugin/plugin.json` (manifest
  rename + version bump for FR-013).
- `specs/001-readme-coverage-cost/` (validation-run notes, plan
  artifacts, and final tasks).

**Testing**: Manual end-to-end validation runs against curated playlists.
The user-facing acceptance test is Story 1's Independent Test — a reader
who has never used the plugin can answer four specific questions from the
README alone within three minutes. No automated test harness is added.

**Target Platform**: GitHub-rendered Markdown for the README; the
existing plugin runtime for the validation runs.

**Project Type**: Documentation update + paired manual validation runs.
None of the template's stock options (single-project / web app /
mobile+API) apply.

**Performance Goals**: Reader answers all four Story-1 questions within
three minutes (SC-001).

**Constraints**:
- No genre-generality claim that has not been demonstrated in a recorded
  run (SC-004).
- 100% of "Expected cost" figures sourced from recorded runs with stated
  methodology (SC-003).
- Validation runs MUST cover one MPB playlist and one non-electronic
  non-MPB playlist before the README ships (SC-002).
- Top-level README structure is preserved; section *content* may be
  edited where this feature requires it. Install section is modified
  per FR-012; the rest of the existing sections retain their factual
  content (FR-006).
- Both install paths (slash-command + UI walkthrough) are verified
  working from a fresh Claude Code session before merge (FR-012,
  SC-007).

**Scale/Scope**: One README (~115 lines current → ~150–220 expected
post-rewrite); two validation-run notes minimum; ≤4 new top-level
sections added to the README.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

Constitution v1.0.0 (`.specify/memory/constitution.md`). Each principle
evaluated against this feature:

| Principle | Status | Notes |
| --------- | ------ | ----- |
| I. Skill-First Workflow Design | ✅ PASS | No new user-facing capability is introduced; the SKILL.md body is unchanged. The feature is editorial documentation + validation data + manifest rename. The principle's "skill body is the product" rule does not apply because no product behavior is added. |
| II. Verifiable Data Provenance (NON-NEGOTIABLE) | ✅ PASS — REINFORCING | This feature is in active service of Principle II. Every figure in the new "Expected cost" section and every entry in "What's been validated" MUST come from a recorded run (FR-002, FR-003, SC-003). The README replaces the current unbacked "Works for any genre" claim with a coverage report (FR-005, SC-004). The install section's "verified" boolean (Key Entity: Install path) enforces the same posture for install instructions — both paths must be exercised before publish, not claimed on faith (FR-012, SC-007). |
| III. Privacy by Default | ✅ PASS | No new network calls, telemetry, analytics, or token-path changes. Validation runs use the existing Spotify + WebSearch path already permitted by the principle. |
| IV. Reversible Writes with Explicit Consent | ✅ PASS | The "write" here is a file edit on a feature branch, reviewed in PR. The validation runs themselves follow the skill's existing reversibility defaults (new-playlist creation, not in-place mutation). The marketplace rename is reversible by `marketplace.json` revert; the migration impact for existing users is explicitly flagged via release notes (SC-008 edge case). |
| V. Versioned, Reproducible Distribution | ✅ PASS — MANDATORY ACTION | The marketplace rename (FR-013) is a breaking change for users with the old `spotify-set-reorder` marketplace registration. `0.3.0` MINOR bump is mandatory (not advisory): both `plugin.json` and `marketplace.json` MUST be bumped together and kept in sync (SC-008). Build artifacts under `servers/spotify-mcp-server/build/` are unchanged this feature, so the "build is committed and current" rule is satisfied trivially. |

**Verdict**: All five gates pass. No Complexity Tracking entries needed.

## Project Structure

### Documentation (this feature)

```text
specs/001-readme-coverage-cost/
├── plan.md                          # This file
├── research.md                      # Phase 0 — decisions on validation methodology, feedback routing, etc.
├── data-model.md                    # Phase 1 — entity schemas: Use case, Genre validation entry, Cost band, Feedback channel, Validation run record
├── quickstart.md                    # Phase 1 — how to execute Story 2's validation runs and feed the output into Story 1's README sections
├── contracts/
│   ├── readme-section-schema.md     # Required shape of each new README section
│   └── validation-run-schema.md     # Required fields of a validation-run note
├── checklists/
│   └── requirements.md              # Pre-existing spec-quality checklist
├── runs/                            # Created in Phase 1; populated when Story 2 executes
│   ├── mpb-<date>.md                # Validation run #1 (MPB)
│   └── nonelectronic-<date>.md      # Validation run #2 (non-electronic non-MPB)
├── spec.md
└── tasks.md                         # Created later by /speckit-tasks (NOT by this command)
```

### Source files touched by this feature

```text
README.md                                                 # rewrite target (root); Install section gets two side-by-side paths
.claude-plugin/marketplace.json                          # name rename + 0.2.2 → 0.3.0 bump (FR-013, SC-008)
plugins/spotify-set-reorder/.claude-plugin/plugin.json   # 0.2.2 → 0.3.0 bump, kept in sync with marketplace.json
```

The plugin's skill bodies, MCP server, Python helper, and SessionStart
hook are **not** touched.

**Structure Decision**: This feature operates on existing distribution
artifacts (`README.md` and the two manifest files) plus a new
`specs/001-readme-coverage-cost/runs/` subdirectory for the validation
records. No new application code is introduced. The template's stock
trees (`src/`, `backend/`/`frontend/`, mobile + API) are intentionally
omitted because none describe this feature.

## Complexity Tracking

No constitution violations to justify. Principle V is satisfied as a
mandatory action (marketplace rename + MINOR bump), not as an
advisory note.

## Post-design re-check

*Filled after Phase 1 artifacts are produced.*

| Principle | Status | Notes |
| --------- | ------ | ----- |
| I. Skill-First Workflow Design | ✅ PASS | Phase 1 artifacts (data-model.md, contracts/) describe the README's content shape and validation-run note shape; neither introduces new product behavior. Skill bodies untouched. |
| II. Verifiable Data Provenance | ✅ PASS — REINFORCED | Phase 1 hardens the rule: `contracts/validation-run-schema.md` requires every run note to carry a `data_provenance` block (counts for `websearch` / `partial` / `estimated` / `unknown`) and *invalidates the run* if the four counts don't sum to `input_track_count`. That makes Principle II's per-track `source` field visible at the aggregate level and impossible to silently skip. README cost figures (`contracts/readme-section-schema.md`) similarly cannot be published unless `runs_underpinning` is non-empty. |
| III. Privacy by Default | ✅ PASS | Phase 1 design adds no new network calls. |
| IV. Reversible Writes with Explicit Consent | ✅ PASS | Quickstart explicitly instructs the maintainer to confirm the skill defaults to a new playlist for validation runs; in-place mutation is forbidden during validation. |
| V. Versioned, Reproducible Distribution | ✅ PASS — MANDATORY | Quickstart's Phase C records the marketplace rename + MINOR bump (0.2.2 → 0.3.0) as a gating step, not advisory. Both manifest files MUST be bumped together; release notes MUST include the migration paragraph for affected users (SC-008). |

**Verdict**: Phase 1 design preserves all five gates.

## Agent Context Update

The plan workflow's "update CLAUDE.md between SPECKIT markers" step is
**deferred**. Rationale:

1. `CLAUDE.md` does not exist in the working tree on this feature branch
   (it landed on `main` as commit `40778eb`, after this branch was cut).
2. The CLAUDE.md committed to `main` does not currently contain
   `<!-- SPECKIT START -->` / `<!-- SPECKIT END -->` markers.

A small follow-up at merge time (or in a separate trivial PR against
`main`) should add the markers and a reference to this plan. Documented
here so the step is not silently lost.
