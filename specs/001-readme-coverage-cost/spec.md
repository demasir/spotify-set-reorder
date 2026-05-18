# Feature Specification: Honest README — Use Cases, Limitations, Cost, Feedback

**Feature Branch**: `001-readme-coverage-cost`

**Created**: 2026-05-18

**Status**: Draft

**Input**: GitHub issue [demasir/spotify-set-reorder#3](https://github.com/demasir/spotify-set-reorder/issues/3):
"README: casos de uso, limitações, cobertura de testes e visibilidade de custo"

## User Scenarios & Testing *(mandatory)*

### User Story 1 — Prospective user evaluates the plugin before installing (Priority: P1)

A developer or DJ stumbles on the GitHub repo from a link, a forum, or a search.
Before they commit to creating a Spotify Developer app and authorizing OAuth,
they read the README to decide whether the tool is worth installing for *their*
specific situation. Today the README sells the workflow but does not tell them
which catalogs the plugin has actually been validated on, what reordering goals
work well, or what running it will cost them. The user closes the tab or
installs blind. This story replaces that with a README that lets the user make
an informed go/no-go decision in under three minutes of reading.

**Why this priority**: This is the primary user-facing artifact for everyone
who hasn't installed yet. Every other story in this feature exists to make
this README honest. Without it, the project is over-selling generality it
hasn't demonstrated and hiding a cost the user can't predict — both of which
erode trust at first contact. Highest leverage, lowest implementation risk.

**Independent Test**: A reader who has never used the plugin can answer the
following from the README alone, without opening any other file or running
anything:
1. Name two concrete use cases the tool has been validated on.
2. Name at least one genre/context the tool has *not* yet been validated on.
3. Estimate the token cost of reordering a 50-track playlist within a stated
   range.
4. Find the channel for reporting a musical-quality concern (not a bug).

If all four are answerable in under three minutes, the story passes.

**Acceptance Scenarios**:

1. **Given** a reader opening the README for the first time,
   **When** they reach the "Use cases" section,
   **Then** they see at least three concrete reorder intents that have been
   run end-to-end (each with the original catalog style and the resulting
   outcome described in one sentence).
2. **Given** a reader concerned about whether their genre is supported,
   **When** they reach the "What's been validated" section,
   **Then** they see an explicit table or list separating genres validated
   objectively (workflow ran, write succeeded, backup generated) from those
   validated subjectively (sequencing assessed as musically coherent), and
   they see at least one genre flagged as "not yet validated."
3. **Given** a reader budgeting their LLM token spend,
   **When** they reach the "Expected cost" section,
   **Then** they see token-consumption ranges for at least three playlist
   sizes (e.g., small / medium / large), with the size bands defined and the
   ranges backed by actual recorded runs rather than estimates.
4. **Given** a reader who has run the plugin and wants to report a result,
   **When** they reach the "Feedback" section,
   **Then** they see two clearly distinguished tracks — mechanical issues
   (install, auth, API errors, crashes) and musical issues (sequencing
   quality, harmonic transitions, cultural reading) — and the channel for
   each.

---

### User Story 2 — Maintainer validates the plugin on an untested genre before publishing the README (Priority: P2)

The current "any genre works" claim in the README has only been demonstrated
for house and its sub-vertentes. Before the new README ships, the maintainer
needs to run the skill end-to-end on at least two catalogs outside electronic
dance music — one MPB playlist (the framework's own canonical "BPM as
constraint, not guide" case) and one playlist in a different non-electronic
style (rock, jazz, hip-hop, samba, etc.). Each run yields a subjective
verdict ("worked" / "partially worked" / "didn't work") with one-sentence
reasoning, plus the token consumption number for the cost section.

**Why this priority**: The honesty of Story 1 depends on the data this story
produces. Without these runs, the "limitations" section in the README is
speculation; with them, it's a report. This is gating work for publishing the
updated README, not a separate deliverable.

**Independent Test**: After this story is complete, the maintainer can point
to two recorded runs (one MPB, one non-electronic non-MPB) with: the input
playlist, the intent, the resulting sequence, a subjective verdict, and the
recorded token consumption.

**Acceptance Scenarios**:

1. **Given** the maintainer wants to make a defensible "untested" claim,
   **When** they run the skill on an MPB playlist with a representative
   intent (e.g., "sessão contemplativa, MPB pós-2000"),
   **Then** they record the input, the output, the subjective verdict, and
   the observed token consumption in a notes file under
   `specs/001-readme-coverage-cost/`.
2. **Given** the maintainer wants to test outside dance music in general,
   **When** they run the skill on a non-electronic non-MPB playlist
   (rock / jazz / hip-hop / samba / other),
   **Then** they record the same fields as above.
3. **Given** both runs are complete,
   **When** they review the results,
   **Then** the README "What's been validated" section reflects exactly what
   was observed — including failures, "partially worked" outcomes, or
   surprises — and does not paper over them.

---

### Edge Cases

- The maintainer runs the MPB validation and the result is poor. The README
  must still publish — it just labels MPB as "validated, results
  unsatisfactory, see notes" rather than "untested." Honest negative
  outcomes are a feature, not a blocker.
- The maintainer runs a non-electronic playlist and the workflow fails
  mechanically (e.g., a Spotify API error specific to large catalogs).
  Story 2 surfaces the mechanical failure as a known limitation rather
  than as a successful validation.
- Token-consumption numbers vary run-to-run (search hits/misses, retries).
  The README ranges must be presented as ranges, not point estimates, and
  the methodology (single-run vs. averaged) must be stated.
- Playlist size affects cost roughly linearly because WebSearch runs per
  track; the cost section must make the per-track scaling explicit so users
  with 200+ track playlists can extrapolate.
- A user reports a musical-quality concern in the bug tracker (intended for
  mechanical issues). The README routing must be clear enough that this is
  rare; when it happens, the maintainer's response should redirect, not
  ignore.

## Requirements *(mandatory)*

### Functional Requirements

#### README content (Story 1)

- **FR-001**: The README MUST include a "Use cases" section with at least
  three concrete reorder intents that have been executed end-to-end, each
  pairing the original catalog style with a one-sentence outcome
  description.
- **FR-002**: The README MUST include a "What's been validated" section
  that separates genres validated objectively (workflow ran, write
  succeeded, backup generated) from genres validated subjectively
  (sequencing assessed as musically coherent), with at least one genre
  explicitly flagged as not yet validated.
- **FR-003**: The README MUST include an "Expected cost" section showing
  token-consumption ranges for at least three playlist-size bands (e.g.,
  ≤30 tracks / 30–100 / 100+), each backed by recorded runs rather than
  estimates, and stating per-track scaling so readers can extrapolate.
- **FR-004**: The README MUST include a "Feedback" section that distinguishes
  the channel for mechanical issues from the channel for musical-quality
  concerns, and explicitly invites the second kind (which is harder to
  surface and most valuable to the project).
- **FR-005**: The README MUST NOT claim genre generality that has not been
  demonstrated; specifically, the current "Works for any genre" framing
  MUST be replaced with language that reflects actual validation coverage.
- **FR-006**: The README's existing structure (install, first-run setup,
  use, privacy, troubleshooting, contributing, license) MUST be preserved;
  new sections are additions and reframings, not a full rewrite.

#### Validation runs (Story 2)

- **FR-007**: At least one MPB playlist MUST be run end-to-end through the
  skill before the updated README is published, with the input playlist,
  intent, output sequence, subjective verdict, and recorded token
  consumption captured in `specs/001-readme-coverage-cost/`.
- **FR-008**: At least one non-electronic, non-MPB playlist (rock, jazz,
  hip-hop, samba, or other) MUST be run end-to-end before publish, with
  the same fields captured.
- **FR-009**: The validation notes MUST distinguish objective outcome
  (workflow ran, write/backup succeeded) from subjective outcome
  (sequencing musically coherent), since both are surfaced separately in
  the README.

#### Token visibility in skill output — split out

- **FR-010**: Per-run token-consumption visibility in the skill output is
  **out of scope** for this feature; a follow-up issue MUST be opened in
  the repository before this spec is considered ready for planning, and
  the issue link MUST be recorded under "Out of Scope" below. Rationale:
  the existing README rewrite delivers user value independently and does
  not require this feature; bundling them would slow the README ship and
  risks the implementation discovering a harness-level blocker that
  invalidates the time-box.

### Key Entities

- **Use case**: A validated reorder run. Attributes: catalog style, user
  intent, outcome summary, observed token consumption, run date.
- **Genre validation entry**: A row in the "What's been validated" table.
  Attributes: genre, objective verdict (passed / failed mechanically /
  not run), subjective verdict (coherent / partial / incoherent / not
  rated), notes.
- **Cost band**: A row in the "Expected cost" section. Attributes:
  playlist-size range, observed token range, methodology note
  (single-run / averaged / per-track derived).
- **Feedback channel**: A row in the "Feedback" section. Attributes:
  category (mechanical / musical), destination (issue tracker / other),
  what to include in the report.

## Clarifications

Resolved during initial drafting (2026-05-18):

- **Q1 — README language**: **English only.** Matches the rest of the
  repo (code, CLAUDE.md, current README); the issue is in Portuguese only
  because that is the maintainer's working language, not because the
  audience is PT-BR.
- **Q2 — Scope of token-visibility-in-skill**: **Deferred to a follow-up
  issue.** Story 3 is removed from this feature's scope; the README
  rewrite ships independently. A follow-up issue MUST be filed in the
  repository before `/speckit-plan`; its link is recorded under
  "Out of Scope" below.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A first-time reader can answer all four questions from
  Story 1's Independent Test (use cases, untested genres, cost band for
  50-track playlist, feedback channel) within three minutes of opening
  the README.
- **SC-002**: At least two non-house validation runs (one MPB, one other
  non-electronic) are recorded under `specs/001-readme-coverage-cost/`
  before the updated README is merged to `main`.
- **SC-003**: 100% of cost figures in the README "Expected cost" section
  are sourced from recorded runs, not estimates; the methodology line
  states which.
- **SC-004**: The README does not contain the phrase "Works for any genre"
  or equivalent unqualified generality claim; instead, the validated /
  not-yet-validated split is explicit.
- **SC-005**: The "Feedback" section names two distinct channels
  (mechanical vs. musical) and explicitly invites the latter kind.
- **SC-006**: A follow-up issue tracking per-run token-consumption
  visibility in the skill output is filed in the repository before
  `/speckit-plan` runs on this feature, and the issue link is recorded
  under "Out of Scope" in this spec. Closes the Q2 decision point.

## Assumptions

- The README's audience is split roughly between "developers evaluating a
  Claude Code plugin" and "DJs / curators evaluating a Spotify tool";
  both groups read the same README and must come away informed.
- Token consumption is roughly linear in playlist length because WebSearch
  runs per-track during enrichment; the cost section can therefore present
  per-track scaling alongside total ranges.
- The maintainer has access to one MPB playlist and one non-electronic
  non-MPB playlist suitable for an end-to-end run; if not, this assumption
  is renegotiated in Story 2's first acceptance scenario.
- "Subjective verdict" on a sequencing outcome is the maintainer's own
  judgment, not a panel review or A/B test. The README states this
  honestly: one person's ear is a constraint, not a flaw to hide.
- The README rewrite is editorial — no install flow, OAuth flow, or
  troubleshooting fact changes are in-scope here. Those exist in their
  current form and stay.

## Out of Scope

- Rewriting the Camelot reference, harmonic-mixing notes, or any content
  under `plugins/spotify-set-reorder/skills/spotify-set-reorder/references/`.
- Changes to the install / OAuth / first-run setup flow itself (the
  README *describes* these flows; this feature doesn't alter them).
- A new "musical quality" feedback intake mechanism beyond directing
  users to an existing channel (e.g., GitHub issues with a label, a
  short form, or whatever the maintainer prefers — the choice is part
  of this feature's drafting, but building a custom intake system is
  not).
- Localization or translation of the README. Q1 resolved to English only;
  any future PT-BR or other-language version is a separate feature.
- **Per-run token-consumption visibility in the skill output.** Resolved
  per Q2 as a deferred follow-up. Tracking issue:
  [demasir/spotify-set-reorder#4](https://github.com/demasir/spotify-set-reorder/issues/4).
