---
description: "Task list for feature 001-readme-coverage-cost (Honest README)"
---

# Tasks: Honest README — Use Cases, Limitations, Cost, Feedback

**Input**: Design documents in `specs/001-readme-coverage-cost/`

**Prerequisites**: `spec.md`, `plan.md`, `research.md`, `data-model.md`,
`contracts/readme-section-schema.md`, `contracts/validation-run-schema.md`,
`quickstart.md`. All present at HEAD.

**Tests**: NOT included. The spec is explicit (Technical Context →
"Testing": manual end-to-end validation runs; no automated test harness
is added). The "test" of this feature is the maintainer self-administering
Story 1's Independent Test plus the validation-run records under `runs/`.

**Organization**: Two user stories. **US2 (P2) executes before US1 (P1)**
because US1's "Use cases" / "What's been validated" / "Expected cost"
sections derive their content from US2's run records. This inversion is
called out in `quickstart.md` Phase A → Phase B and is the only reason
the priority numbers don't match execution order.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies).
- **[Story]**: US1 / US2 / Cross — maps task to user story for traceability.
- File paths in descriptions are repo-root-relative.

## Path Conventions

This is a documentation + validation feature, not a software feature.
Touched paths:

- `README.md` — at repo root (rewrite target).
- `.claude-plugin/marketplace.json` — marketplace manifest (rename + bump).
- `plugins/spotify-set-reorder/.claude-plugin/plugin.json` — plugin manifest (bump).
- `specs/001-readme-coverage-cost/runs/<run_id>.md` — validation-run records.

No `src/`, `tests/`, `backend/`, `frontend/` — none apply per `plan.md`
→ Project Structure.

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Workspace prep before any story-bearing work.

- [ ] **T001** Create the validation runs directory: `mkdir -p specs/001-readme-coverage-cost/runs/` and add a `.gitkeep` so the empty directory commits. Skip the `.gitkeep` once T012/T013 land run notes in it.
- [ ] **T002** [P] Confirm the maintainer's prerequisites per `quickstart.md` → "Prerequisites": on branch `001-readme-coverage-cost`, plugin installed, `/spotify-set-reorder:setup` previously succeeded on this machine, MPB + non-electronic-non-MPB candidate playlists identified, Spotify Premium account active. No code artifact; this is a self-check the maintainer signs off before T012/T013.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: None. This is a documentation feature; no shared infrastructure blocks the user stories.

**Checkpoint**: Skipped intentionally — proceed directly to Phase 3.

---

## Phase 3: User Story 2 — Validation runs (Priority: P2; gating for US1 data-driven sections)

**Goal**: Produce ≥ 2 end-to-end validation runs (one MPB, one non-electronic non-MPB) whose recorded data backs the README's "Use cases", "What's been validated", and "Expected cost" sections.

**Independent Test** (from `spec.md`): The maintainer can point to two committed records under `specs/001-readme-coverage-cost/runs/` (one MPB, one non-electronic non-MPB), each containing the input playlist, the intent, the resulting sequence, a subjective verdict, and the recorded token consumption — formatted per `contracts/validation-run-schema.md`.

### Implementation for User Story 2

- [ ] **T003** [P] [US2] Execute the **MPB** validation run per `quickstart.md` → Phase A.1: pick a 20–40-track MPB playlist, pick a concrete contemplative intent, invoke `/spotify-set-reorder` and walk all 9 checkpoints unaided, confirm new-playlist mode (Principle IV), record session token total at run end. (Manual maintainer task; produces no file directly.)
- [ ] **T004** [US2] Write the MPB run note at `specs/001-readme-coverage-cost/runs/mpb-<YYYY-MM-DD>.md` strictly per `contracts/validation-run-schema.md` (YAML front matter + `## Subjective notes` + `## Surprises` + `## How tokens were counted`). Validate `data_provenance.websearch + .partial + .estimated + .unknown == input_track_count` before committing; mismatch invalidates the record per the contract.
- [ ] **T005** [P] [US2] Execute the **non-electronic, non-MPB** validation run per `quickstart.md` → Phase A.2: pick one playlist from rock / jazz / hip-hop / samba / other (maintainer's call at run time, recorded in the run note's `genre_family`). Same 9-checkpoint flow, new-playlist mode, token total recorded.
- [ ] **T006** [US2] Write the non-electronic non-MPB run note at `specs/001-readme-coverage-cost/runs/<genre-slug>-<YYYY-MM-DD>.md` per the same contract. Same `data_provenance` validation rule applies.
- [ ] **T007** [P] [US2] *(Optional but recommended per `quickstart.md` Phase A.3)* Backfill a retrospective house run note at `specs/001-readme-coverage-cost/runs/house-<YYYY-MM-DD>.md`. If included, the run note's `## How tokens were counted` section MUST flag retrospective/approximate fields (e.g., `tokens_observed: ~28000 (retrospective, approximate)`). If skipped, document the omission in the PR description; the README's "Use cases" entry for house links to "What's been validated" instead of a run record.
- [ ] **T008** [US2] Commit the run notes. One commit per run is acceptable (`docs(validation): MPB run — <verdict>`, then `docs(validation): <genre> run — <verdict>`); a single combined commit is also acceptable. Delete the `.gitkeep` created in T001 if present.

**Checkpoint (US2 complete)**: `git ls-files specs/001-readme-coverage-cost/runs/` returns ≥ 2 paths (mpb + non-electronic-non-MPB), each parseable per the run-record schema. Story 2 is independently shippable here — the validation evidence exists in the repo regardless of whether US1 is ever drafted.

---

## Phase 4: User Story 1 — Honest README (Priority: P1) 🎯 MVP

**Goal**: Rewrite `README.md` so a first-time reader can answer all five Story-1 Independent-Test questions in under three minutes (concrete use cases, untested genres, expected token cost for a 50-track playlist, feedback channel for musical concerns, install in ≤ 2 copy-pasteable commands).

**Independent Test** (from `spec.md`): A reader who has never used the plugin can answer five questions from the README alone, without opening any other file or running anything:

1. Name two concrete use cases the tool has been validated on.
2. Name at least one genre / context the tool has *not* yet been validated on.
3. Estimate the token cost of reordering a 50-track playlist within a stated range.
4. Find the channel for reporting a musical-quality concern (not a bug).
5. Install the plugin by copy-pasting at most two commands (no UI clicking required).

If all five are answerable in under three minutes by an uninvolved reader, Story 1 passes.

### Sub-phase 4a — Marketplace rename + install verification (FR-012, FR-013, SC-007, SC-008; gates the Install section)

These tasks ship the breaking-change rename before the Install section is written so the README copy-paste resolves to the new marketplace name. Per `quickstart.md` → Phase B.2.5, verification of the slash-command path happens BEFORE the rename + bump is committed, so a failed verification falls back cleanly to the spec's edge-case behavior (publish with side-by-side paths + file a follow-up issue).

- [ ] **T009** [P] [US1] Edit `.claude-plugin/marketplace.json`: change the `name` field from `spotify-set-reorder` to `spotify-tools` (the working-assumption name from `plan.md` / `research.md` → R11; final name is the maintainer's call at this point, but it MUST be distinct from the plugin name per SC-008). Do NOT commit yet — verification (T011) runs against this uncommitted state.
- [ ] **T010** [P] [US1] Edit `plugins/spotify-set-reorder/.claude-plugin/plugin.json`: bump `version` from `0.2.2` to `0.3.0` (MINOR in 0.x per `plan.md` Constitution Check → Principle V). Also bump the same `version` field in `.claude-plugin/marketplace.json` to `0.3.0` (Principle V's sync rule: both manifests must move together). Do NOT commit yet.
- [ ] **T011** [US1] Verify the slash-command install path per `quickstart.md` → Phase B.2.5 (depends on T009 + T010). From a fresh Claude Code session (run `./scripts/dev-reset.sh` first or `/plugin marketplace remove spotify-set-reorder` to wipe any prior registration of the old name), exercise `/plugin marketplace add <repo-or-local-path>` followed by `/plugin install spotify-set-reorder@<new-marketplace-name>`. Document outcome in `specs/001-readme-coverage-cost/runs/install-verify-<YYYY-MM-DD>.md` capturing each command + stdout/UI confirmation, whether the SessionStart auth-nudge fired correctly on the next session, and any failure mode. On failure, the spec's edge case applies: README still publishes with both paths side-by-side, the verification failure is recorded as a known limitation, and a follow-up issue is filed (T024).
- [ ] **T012** [US1] Commit the marketplace rename + version bump as one logical change: `chore: bump to v0.3.0 — marketplace rename` covering `.claude-plugin/marketplace.json`, `plugins/spotify-set-reorder/.claude-plugin/plugin.json`, and the install-verify run note from T011. This is a separate commit from the README content (T020) so reviewers see the breaking change cleanly.

### Sub-phase 4b — README content rewrite (FR-001 … FR-006, FR-012)

All tasks here edit a single file (`README.md`). Marked serial (no `[P]`) because parallel edits to the same file would conflict; the maintainer drafts them in sequence. Each task corresponds to one section of `contracts/readme-section-schema.md`.

- [ ] **T013** [US1] Edit `README.md` tagline / pitch paragraph (top of file, under H1) per `contracts/readme-section-schema.md` → "Section: Tagline / pitch (modified)": remove the phrase "Works for any genre" and any equivalent unqualified-generality wording (FR-005, SC-004); replace with language pointing the reader at "What's been validated" for the actual coverage report. The rest of the tagline paragraph is preserved.
- [ ] **T014** [US1] Insert `## Use cases` section in `README.md` between `## What's in the box` and `## Requirements` (positioning per `contracts/readme-section-schema.md`). Exactly 3 entries; each entry has `catalog_style` (bold) + `user_intent` (italic/quoted) + one-sentence `outcome_summary` + a relative link to its underlying record under `specs/001-readme-coverage-cost/runs/` (per data-model.md Entity 1). Depends on T004 + T006 (+ T007 if house is included). Grep before next task: confirm no forbidden phrases ("should work for", "would also work", "in theory", "any genre").
- [ ] **T015** [US1] Insert `## What's been validated` section immediately after `## Use cases`. Intro line stating the dual axis (objective vs. subjective). Markdown table with columns `| Genre | Objective | Subjective | Notes |` per `contracts/readme-section-schema.md`. At least 3 rows; at least one row MUST be `Objective: not run` (FR-002). Cell-content rules from the contract: `Objective` ∈ `{✅ passed, ❌ failed (mechanical), not run}`; `Subjective` ∈ `{✅ coherent, ⚠️ partial, ❌ incoherent, not rated, n/a}`. No empty cells, no "TBD", no "coming soon".
- [ ] **T016** [US1] Insert `## Expected cost` section immediately after `## What's been validated`. Methodology paragraph (≤ 250 chars) per contract, with a link to issue #4 for per-run visibility. Markdown table with columns `| Playlist size | Total tokens (range) | Per-track avg | Methodology |`; exactly 3 rows: `≤ 30 tracks`, `31–100 tracks`, `101+ tracks` (per data-model.md Entity 3 + research R6). Each cell sourced from `runs_underpinning` — empty `runs_underpinning` for a band forbids publishing that band (data-model Entity 3 validation rule). Closing line: per-track scaling is roughly linear because enrichment runs per-track.
- [ ] **T017** [US1] Modify `## Install` section per `contracts/readme-section-schema.md` → "Section: Install (modified)" (depends on T012). Drop the existing "(one-liner)" qualifier from the heading. Intro line stating two paths are available and both are tested. Two sub-blocks rendered with equal weight (no collapsibles, no "advanced alternative" framing): (A) slash-command code block with the two `/plugin` commands using the **new** marketplace name; (B) ordered 3-step UI walkthrough preserving current content. Verification clause / footnote stating both paths were verified end-to-end from a fresh Claude Code session on the README's publish date (the reader-facing manifestation of SC-007).
- [ ] **T018** [US1] Insert `## Feedback` section between `## Privacy and data` and `## Troubleshooting`. Intro line explicitly stating two welcome categories with musical-quality being the harder + more-valued kind (FR-004 wording matters here — re-read before writing). Exactly 2 subsections / rows: mechanical (`[bug]` prefix) and musical (`[musical]` prefix), each per data-model.md Entity 4. Musical row's `invitation_tone` MUST be `welcoming-and-explicit`. Single destination link (GitHub Issues for `demasir/spotify-set-reorder`); no Issues-vs-Discussions-vs-Forms choice (R4).
- [ ] **T019** [US1] Run the README sanity sweep per `quickstart.md` → Phase B.4: self-administer Story 1's Independent Test (all five questions answerable from the README alone in ≤ 3 minutes by a cold reader); grep `README.md` for forbidden phrases listed in `contracts/readme-section-schema.md` ("works for any", "should work", "would also work", "in theory", "TBD", "coming soon") and confirm none remain; confirm preserved sections (`## What's in the box`, `## Requirements`, `## First-run setup`, `## Use`, `## How it works`, `## Privacy and data`, `## Troubleshooting`, `## Contributing`, `## License`) are ≥ 90% unchanged in body content (FR-006); confirm the install string uses the new marketplace name (`grep "spotify-set-reorder@spotify-set-reorder" README.md` returns nothing).
- [ ] **T020** [US1] Commit the README rewrite as a single `docs(readme): honest README — use cases, validation, cost, install, feedback` commit (or split into 2 if the diff is large: tagline + Install section as one, the four new sections as another). Reference issue #3 in the commit body.

**Checkpoint (US1 complete)**: The README rewrite is on the branch. A reader running Story 1's Independent Test cold can answer all five questions in ≤ 3 minutes. Every cost-band figure traces to a `runs_underpinning` entry. No forbidden phrases. Install section uses the new marketplace name.

---

## Phase 5: Polish & Cross-Cutting (PR, release, post-merge follow-ups)

**Purpose**: Ship the work and execute the post-merge follow-ups the plan and quickstart call out.

- [ ] **T021** [P] [Cross] Draft the **release-notes paragraph** for 0.3.0 per `quickstart.md` → Phase C / SC-008. Final shape lives in the PR description and (post-merge) the GitHub release body. Content: marketplace renamed `spotify-set-reorder` → `spotify-tools`; existing user registrations will not auto-update; affected users run `/plugin marketplace remove spotify-set-reorder` then re-add via the new install path documented in the README; existing plugin install + `/spotify-set-reorder:setup` tokens are NOT affected.
- [ ] **T022** [Cross] Open / update PR #5 per `quickstart.md` → Phase D: title references issue #3, body links every `runs/*.md` (mpb, non-electronic-non-MPB, install-verify, optional house) and the "What's been validated" table, and includes the release-notes paragraph from T021. Reviewer's job (called out in the PR body): verify the README against `contracts/readme-section-schema.md`, confirm each cost-band number traces to a `runs_underpinning` reference, and confirm the install string uses the new marketplace name.
- [ ] **T023** [Cross] *(Post-merge)* Close issue #3 referencing the merge commit. Cut the **0.3.0** release on GitHub, pasting the T021 release-notes paragraph into the release body. Issue #4 stays open as the deferred token-visibility work.
- [ ] **T024** [P] [Cross] *(Conditional)* If T011 (install-path verification) failed, file the follow-up issue called out by the spec's "slash-command install path fails verification" edge case. Otherwise skip.
- [ ] **T025** [P] [Cross] *(Post-merge, follow-up commit on `main`)* Add `<!-- SPECKIT START -->` / `<!-- SPECKIT END -->` markers to `CLAUDE.md` around a short reference to `specs/001-readme-coverage-cost/plan.md`, per `plan.md` → "Agent Context Update". Small one-line commit; not a blocker for this feature's merge, but the plan flagged it so it's not silently lost.
- [ ] **T026** [P] [Cross] *(Optional)* Post a short migration note in any community channel where the plugin was previously announced, repeating the T021 release-notes paragraph for affected users.

---

## Dependencies & Execution Order

### Phase dependencies

- **Phase 1 (Setup)**: no dependencies — can start immediately.
- **Phase 2 (Foundational)**: empty for this feature.
- **Phase 3 (US2 — validation runs)**: depends on Phase 1.
- **Phase 4 (US1 — README rewrite)**: depends on Phase 3 for sub-phase 4b (the data-driven sections T014/T015/T016). Sub-phase 4a (T009 … T012) can run in parallel with Phase 3 — the rename + bump + install verification do not consume the run notes.
- **Phase 5 (Polish)**: depends on Phase 4 except for post-merge tasks (T023, T025, T026), which depend on the PR landing.

### Within-story ordering

US2 ordering: T003 → T004; T005 → T006; T007 is independent. T008 is the final commit step.

US1 ordering — sub-phase 4a is gated: T009 + T010 (parallel, different files) → T011 (verification, depends on T009 + T010) → T012 (commit, depends on T011). Sub-phase 4b is serial because all tasks edit `README.md`: T013 → T014 → T015 → T016 → T017 → T018 → T019 → T020. T014/T015/T016 additionally depend on US2 outputs.

### Parallel opportunities

- T001 + T002 (Phase 1) are independent.
- T003 + T005 (the two validation runs) are independent — different playlists, different run notes — but in practice the maintainer executes them serially (one Claude Code session at a time).
- T007 (optional house backfill) is independent of T003 / T005 and can be written from memory at any time.
- T009 + T010 (different manifest files) are independent.
- Sub-phase 4a (T009 → T012) can run in parallel with Phase 3 (validation runs).
- T021 (release-notes draft) is independent of T013 … T020 and can be written at any time after the rename name is chosen.
- T024 / T025 / T026 are independent of each other.

---

## Implementation Strategy

### MVP path (single maintainer, serial)

The fastest realistic single-operator order:

1. T001 (mkdir + .gitkeep) → T002 (self-check).
2. T009 + T010 (manifest edits, ~5 minutes; do this first so T011's verification can use the new name).
3. T011 (install-path verification, ~10 minutes). On failure, log the limitation and continue.
4. T003 → T004 (MPB run, ~25–45 minutes depending on playlist size).
5. T005 → T006 (non-electronic non-MPB run, ~25–45 minutes).
6. *(Optional)* T007 (house backfill, ~10 minutes).
7. T008 (commit run notes) → T012 (commit rename + bump).
8. T013 → T020 (README rewrite, ~60–90 minutes).
9. T021 (release-notes draft).
10. T022 (open / update PR).
11. Post-merge: T023, T024 if needed, T025, T026.

### Incremental delivery option

US2 alone is shippable: a `docs(validation): record MPB + <genre> runs` PR with the run records, with no README changes, would be a coherent unit of work. It just doesn't satisfy issue #3 on its own. If the README rewrite turns out to need rework, US2 still ships independently.

---

## Notes

- **No automated tests added in this feature.** The validation runs ARE the tests for the underlying claims; Story 1's Independent Test is the test for the README itself.
- **One file, many tasks**: README.md is edited by T013 … T019. These are listed as serial tasks deliberately; do not parallelize them.
- **Principle II is the load-bearing constitutional check** for this feature. Every figure in the README's "Expected cost" section must trace to a `runs_underpinning` entry in a `runs/*.md` file. Every entry in "What's been validated" must trace to a row whose verdict came from a run (or be explicitly marked `not run`). If a reviewer cannot follow the trace, the feature is not done.
- **Reversibility**: the marketplace rename in T009 + T010 is breaking for existing user registrations. The T021 release-notes paragraph is mandatory mitigation per SC-008 and Principle IV; do not ship the rename without it.
- **Out of scope** (re-stated from `spec.md` → "Out of Scope" so it doesn't accidentally creep in here): per-run token visibility inside skill output (issue #4); Camelot / harmonic-mixing reference rewrite; install / OAuth flow changes; custom musical-feedback intake mechanism; README localization.
