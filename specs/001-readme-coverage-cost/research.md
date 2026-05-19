# Phase 0 Research: Honest README — Use Cases, Limitations, Cost, Feedback

**Feature**: `specs/001-readme-coverage-cost/`
**Date**: 2026-05-18

This document resolves the open questions that surface from the Technical
Context in `plan.md`. Each item follows the *Decision / Rationale /
Alternatives* shape.

---

## R1. Validation-run methodology — single run per playlist or averaged?

**Decision**: One run per playlist for both Story-2 catalogs (MPB +
non-electronic non-MPB). The recorded token consumption is the single
observed value; the "Expected cost" section labels each cost band's
methodology as `single-run` or `single-run + extrapolation per-track`
where appropriate.

**Rationale**:

- WebSearch results vary per run (cache hits, retries), so cost is
  inherently noisy. A single number is honest about that noise; an
  averaged number hides it without reducing it.
- The validation runs are gating work to publish the README. Doubling
  or tripling them to average increases time-to-ship without producing
  qualitatively better data — the spread we report would still be
  wide.
- If a single run produces an obviously broken result (mechanical
  failure, anomalously low/high consumption), the maintainer reruns and
  the run-note records both runs with the reason for the rerun. This is
  cheaper than mandating N runs upfront.

**Alternatives considered**:

- *Average of 3 runs per playlist*: rejected — slows the validation
  phase and the resulting average still has a confidence interval the
  README would need to disclose.
- *Single run + WebSearch cache pre-warm*: rejected — would understate
  cost for new users whose cache is cold.

---

## R2. Token-consumption recording protocol (given #4 is deferred)

**Decision**: For each validation run, the maintainer records the
session-level token consumption from Claude Code's session UI at the
moment the run completes, copying the number into the run note. Until
issue #4 lands, this is the *only* visibility mechanism. The README's
"Expected cost" section explicitly states: "Numbers below are recorded
from Claude Code session totals at the end of each run; per-run
token-consumption inside the skill output is tracked in #4."

**Rationale**:

- This unblocks publishing the README *now*. Waiting on #4 would couple
  this feature to a deferred decision, defeating the whole point of the
  Q2 split.
- The session UI is the official, user-visible source of truth for
  token consumption in Claude Code today; pointing the README at it is
  honest and reproducible by readers.
- It makes the limitation visible: a reader who wants per-step costs
  gets pointed at the right follow-up issue, not stonewalled.

**Alternatives considered**:

- *Block on #4 first*: rejected — directly contradicts the Q2 spec
  decision.
- *Estimate tokens from message count*: rejected — fabricating numbers
  violates Principle II.

---

## R3. Use-case selection — which 3+ examples make the README cut?

**Decision**: The "Use cases" section MUST include exactly three entries
at first publish, all of which have a validated run behind them:

1. **House — peak-time set build** (existing house validation; the
   maintainer's strongest evidence area).
2. **MPB — contemplative listening session** (Story 2 run #1).
3. **Non-electronic non-MPB — to be selected during the validation
   phase** (Story 2 run #2; genre family to be picked by the
   maintainer when scheduling the run).

The "What's been validated" table can list *more* genres (e.g.,
sub-vertentes of house: deep / tech / prog) but the "Use cases" section
caps at three to keep the README skimmable.

**Rationale**:

- Three is the spec's stated floor (FR-001) and the smallest number
  that demonstrates non-trivial breadth (one electronic, one MPB, one
  other).
- More than three risks turning "Use cases" into a wall of text the
  reader skims past — defeating SC-001's three-minute test.
- All three must be backed by a recorded run, per the spec's "no
  fabricated generality" rule.

**Alternatives considered**:

- *List 5–7 use cases including aspirational ones*: rejected —
  contradicts FR-005 and SC-004.
- *List only the two new runs (drop house)*: rejected — house is the
  maintainer's strongest evidence and excluding it understates the
  tool's current state.

---

## R4. Feedback routing — mechanical vs musical concerns

**Decision**: Both feedback types route to the same place — GitHub
Issues at `demasir/spotify-set-reorder` — but the README explicitly
defines the two categories and provides a copy-pasteable issue title
prefix for each:

- **Mechanical issues** (install, OAuth, API errors, crashes): title
  prefix `[bug]`, plain issue, no special form.
- **Musical-quality concerns** (sequencing felt off, harmonic
  transitions broke, cultural reading missed): title prefix
  `[musical]`, body should include the playlist link (if shareable),
  the original intent, and a one-paragraph description of *what felt
  wrong*. The README states this is the most valuable feedback type
  and explicitly invites it.

No new labels, no GitHub Discussions, no external form. If `[musical]`
issues accumulate enough volume to need their own intake, that becomes
a follow-up.

**Rationale**:

- The simplest routing that distinguishes the two categories without
  adding infrastructure. Issue prefixes are zero-cost and visible in
  the issue list.
- Asking the user to choose between two channels (Issues vs
  Discussions vs Forms) raises the cost of giving feedback. One
  destination with a clear title convention is lower-friction.
- The README's invitation language (per FR-004) does the heavy lifting:
  explicitly stating that musical feedback is welcome and hard to get
  is what surfaces it.

**Alternatives considered**:

- *Separate labels (`bug`, `musical-feedback`) with no title prefix*:
  rejected — labels are invisible to a first-time issue filer.
- *GitHub Discussions for musical, Issues for mechanical*: rejected —
  doubles the surface area the maintainer monitors and confuses the
  reader.

---

## R5. README structure — where do the new sections go?

**Decision**: Insert the new sections in this order, between
"What's in the box" and "Requirements":

```
# spotify-set-reorder
(tagline + 1-paragraph pitch — existing, lightly edited per FR-005 to remove "any genre")

## What's in the box       (existing)

## Use cases               (NEW — FR-001)
## What's been validated   (NEW — FR-002)
## Expected cost           (NEW — FR-003)

## Requirements            (existing)
## Install                 (existing)
## First-run setup         (existing)
## Use                     (existing)
## How it works            (existing)
## Privacy and data        (existing)
## Feedback                (NEW — FR-004; replaces/expands current "Contributing" close)
## Troubleshooting         (existing)
## Contributing            (existing — possibly merged with new Feedback section)
## License                 (existing)
```

**Rationale**:

- "Use cases / What's been validated / Expected cost" surface the
  trust signals *before* the reader has invested in reading install
  details — matches Story 1's three-minute test (SC-001).
- "Feedback" sits late, after the reader has had a chance to use the
  tool (logical reading flow: install → use → give feedback).
- "Troubleshooting" stays where it is — it's a reference, not a
  trust signal.
- Preserving the existing structure satisfies FR-006 ("additions and
  reframings, not a full rewrite").

**Alternatives considered**:

- *Use cases at the very top, before "What's in the box"*: rejected —
  the existing tagline already serves that role and replacing it would
  violate FR-006.
- *Combine "What's been validated" and "Expected cost" into one
  section*: rejected — they answer different reader questions
  (coverage vs cost) and combining hurts skimmability.

---

## R6. Cost-band thresholds — how are small / medium / large defined?

**Decision**: Three bands keyed to track count:

- **Small**: ≤ 30 tracks.
- **Medium**: 31–100 tracks.
- **Large**: 101+ tracks.

Each band reports observed total tokens (range) AND per-track average
(single number), so readers with a playlist size between the bands can
interpolate.

**Rationale**:

- 30/100 are intuitive psychological thresholds and roughly match
  user-perceived "short / album-ish / long" boundaries.
- Per-track scaling is reliable because WebSearch dominates cost and
  runs per-track. Stating both lets the reader extrapolate (FR-011's
  scaling requirement).
- Three bands is the spec floor (FR-003); more would suggest
  precision the data doesn't justify.

**Alternatives considered**:

- *50/100/150 bands*: rejected — less intuitive, and "≤ 30" matches
  more common DJ-set playlist sizes (a typical 2-hr set is ~25–35
  tracks).
- *Single per-track number, no bands*: rejected — hides fixed-overhead
  components (the sequencing reasoning step does not scale linearly
  with track count).

---

## R7. Genre taxonomy granularity for "What's been validated"

**Decision**: One row per high-level genre family. Sub-styles tested
appear in a `notes` column on the same row. Example:

| Genre | Objective | Subjective | Notes |
|-------|-----------|------------|-------|
| House | ✅ | ✅ | Deep, tech, prog tested |
| MPB | ✅ | (verdict from run #1) | Pós-2000 sub-style tested |

**Rationale**:

- Keeps the table short (≤ 5 rows at first publish), matching the
  three-minute reader test.
- The notes column captures sub-style information without expanding the
  table to dozens of rows.
- Easy to extend later: a new genre family is a new row, not a schema
  change.

**Alternatives considered**:

- *One row per sub-style*: rejected — explodes the table size; readers
  scanning for "is jazz tested?" don't care about sub-styles yet.
- *Free-text section instead of a table*: rejected — the spec's
  acceptance scenario for Story 1 #2 wants a "table or list" that
  separates objective from subjective verdicts; a table is the
  clearest way to honor that.

---

## R8. Treatment of failed or unsatisfactory validation runs

**Decision**: All validation runs are recorded under
`specs/001-readme-coverage-cost/runs/`, regardless of outcome. The
"What's been validated" table reflects exactly what was observed:

- Mechanical failure (workflow crashed, API error) → Objective: ❌,
  Subjective: n/a, Notes column describes the failure.
- Workflow ran but sequencing was poor → Objective: ✅, Subjective: ❌
  or ⚠️ (partial), Notes column describes the failure mode.
- Both succeeded → ✅ / ✅.

The README publishes regardless of how the runs land. An MPB run that
the maintainer judges "didn't work" becomes a genuine, useful warning
to readers — not a blocker.

**Rationale**:

- This is the spec's stated edge-case handling (the first three edge
  cases under Story 2). Documenting it explicitly in research avoids
  a future "but the run failed, do we ship?" moment.
- Honest negative outcomes are Principle II's most valuable evidence
  — they prevent the README from over-selling.

**Alternatives considered**:

- *Rerun until success then publish*: rejected — leads to selection
  bias and contradicts Principle II.
- *Hold publication if any run fails*: rejected — same selection bias
  problem and indefinitely delays a separately-valuable rewrite.

---

## R9. Version-bump policy at merge (Principle V advisory)

**Decision**: At merge time, bump the PATCH digit of both
`plugins/spotify-set-reorder/.claude-plugin/plugin.json` and
`.claude-plugin/marketplace.json`. The README rewrite is a meaningful
user-visible change even though no plugin behavior changes; a PATCH
bump signals "something worth re-reading" to users tracking releases.

This is recorded as a checklist item in `quickstart.md` rather than
gated by the plan because Principle V calls this advisory, not
mandatory, when no code changes ship.

**Rationale**:

- Honors Principle V's intent (users see version movement when
  user-facing content changes) without overstating the change as
  MINOR/MAJOR.
- Keeps the two manifest versions in sync — the principle's literal
  rule.

**Alternatives considered**:

- *No version bump*: rejected — leaves "I already read this" users
  with no signal that the README has been substantially rewritten.
- *MINOR bump*: rejected — overstates a change that introduces no new
  capability.

---

## R10. Slash-command install path — exact commands and verification

**Decision**: The README's "Install" section presents these two
commands as the slash-command path, side-by-side with the existing UI
walkthrough (FR-012):

```text
/plugin marketplace add https://github.com/demasir/spotify-set-reorder
/plugin install spotify-set-reorder@<marketplace-name>
```

`<marketplace-name>` resolves once R11 is decided — working assumption
is `spotify-tools`, so the second command reads
`/plugin install spotify-set-reorder@spotify-tools`.

Both commands MUST be exercised end-to-end from a fresh Claude Code
session (no prior marketplace registration, no prior plugin install)
before the README is merged. Phase B of `quickstart.md` step B.2.5
formalizes this verification.

**Rationale**:

- The slash-command surface is the lowest-friction install path
  Claude Code offers today: two commands, no UI navigation, no
  reading.
- Verification before publish enforces Principle II's posture against
  unverified claims for instructions, not just for data — the README
  says "this works" only after the maintainer has watched it work.
- Side-by-side presentation (not slash-command-only) handles the
  edge case where Claude Code's `/plugin` surface differs across
  versions or platforms; the UI walkthrough is the fallback that has
  worked since the plugin shipped.

**Verification protocol** (lives in quickstart B.2.5):

1. Fresh Claude Code session (no prior `spotify-set-reorder`
   registration; run `dev-reset.sh` first if needed).
2. Run `/plugin marketplace add https://github.com/demasir/spotify-set-reorder`.
3. Confirm the marketplace appears in `/plugin` UI.
4. Run `/plugin install spotify-set-reorder@<marketplace-name>`.
5. Confirm the plugin is registered and the SessionStart nudge fires
   on next session.
6. Record the outcome of each step. If any step fails, publish the
   README with both paths but note the failure in a follow-up issue
   per FR-012's "side-by-side equal weight" edge-case clause.

**Alternatives considered**:

- *Slash-command-only as primary, UI walkthrough hidden under a
  collapsible*: rejected — defeats the spec's "equal weight" wording
  (FR-012) and adds a single point of failure if Claude Code's
  `/plugin` surface changes.
- *UI walkthrough only (current state)*: rejected — directly
  contradicts the user goal articulated for this feature: "ok,
  entendi pra que serve, como instala, e parece ser simples".

---

## R11. Marketplace rename — why, what to, and migration cost

**Decision**: Rename the marketplace from `spotify-set-reorder` to
`spotify-tools` (the final name is confirmed at implementation time;
the spec commits only to "distinct from the plugin name"). The plugin
itself stays `spotify-set-reorder`. The slash-command install path
then reads `spotify-set-reorder@spotify-tools` — a clean, unambiguous
identifier.

**Rationale**:

- The current state (`spotify-set-reorder@spotify-set-reorder`) reads
  like a typo. The first time a reader sees it in a README, they will
  re-read it twice to confirm it's intentional. That friction
  contradicts SC-001's three-minute reader-test goal.
- The marketplace is logically a *collection*; the plugin is one
  entry in it. Distinct names express that asymmetry. The marketplace
  manifest format explicitly supports multiple plugins (see
  `marketplace.json` schema: `plugins` is an array), so the
  "future-proofing" framing is real, not hypothetical.
- `spotify-tools` is the working name because it (a) is generic
  enough to host future spotify-adjacent plugins, (b) reads naturally
  in the install string, and (c) does not commit the maintainer to a
  specific personal-brand identifier (e.g., `demasir-plugins` would
  bind the marketplace to one owner more tightly than necessary).
  The implementation phase can pick a different name if
  `spotify-tools` clashes with anything; the spec only requires
  "distinct from the plugin name".

**Version bump policy**: `0.2.2 → 0.3.0` (MINOR in 0.x semver).
Justification:

- The rename breaks existing local marketplace registrations. Users
  with the old `spotify-set-reorder` marketplace registered keep
  receiving stale updates until they re-add. That's a user-facing
  break, even if a small one.
- In 0.x, MINOR is the conventional vehicle for breaking changes
  (MAJOR is reserved for 1.0). PATCH would understate the impact;
  MAJOR would overstate it for a plugin still in the 0.x band.
- Both `plugin.json` and `marketplace.json` bump together per
  Principle V's literal sync rule.

**Migration story for affected users** (release notes paragraph):

> If you installed an earlier version via
> `/plugin marketplace add https://github.com/demasir/spotify-set-reorder`,
> the marketplace name has changed from `spotify-set-reorder` to
> `spotify-tools`. To pick up future updates, run
> `/plugin marketplace remove spotify-set-reorder` once, then re-add
> the marketplace. Your existing plugin install and your
> `/spotify-set-reorder:setup` tokens are NOT affected.

**Alternatives considered**:

- *Keep `spotify-set-reorder` as the marketplace name; document
  the duplicated install string*: rejected — every reader pays a
  small "is this a typo?" tax. The spec's three-minute test budget
  is small enough that small taxes matter.
- *Rename only when the marketplace gains a second plugin*: rejected
  — the rename is cheap now (no other plugin depends on the name);
  it's expensive later when a second plugin would have to rename in
  lockstep.
- *Rename to `music-tools` or `dj-tools` or owner-scoped names like
  `demasir-plugins`*: rejected as final but kept available — the
  spec leaves the final name open and the implementation can revisit
  if `spotify-tools` is unsuitable.

---

## Open questions remaining: none

All NEEDS-CLARIFICATION items from the spec were resolved during
drafting (Q1 English, Q2 defer #4). The Technical Context in `plan.md`
has no remaining NEEDS-CLARIFICATION markers after this research pass.
R10 and R11 above resolve the install-simplicity additions surfaced
after the initial spec draft.
