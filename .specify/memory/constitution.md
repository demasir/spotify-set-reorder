<!--
SYNC IMPACT REPORT
==================
Version change: (template, unfilled) → 1.0.0
Bump rationale: Initial ratification. Replaces placeholder template with concrete
principles, sections, and governance. MAJOR per semver because this is the
project's first binding constitution.

Modified principles: (none — initial set)
  - [PRINCIPLE_1_NAME] → I. Skill-First Workflow Design
  - [PRINCIPLE_2_NAME] → II. Verifiable Data Provenance (NON-NEGOTIABLE)
  - [PRINCIPLE_3_NAME] → III. Privacy by Default
  - [PRINCIPLE_4_NAME] → IV. Reversible Writes with Explicit Consent
  - [PRINCIPLE_5_NAME] → V. Versioned, Reproducible Distribution

Added sections:
  - Compatibility & API Stewardship (was [SECTION_2_NAME])
  - Development Workflow (was [SECTION_3_NAME])
  - Governance

Removed sections: (none — all template slots filled)

Templates requiring updates:
  - ✅ .specify/templates/plan-template.md — Constitution Check gate now backed by
       concrete principles; no edit required (the gate language is generic and
       points at this file).
  - ✅ .specify/templates/spec-template.md — Generic; no principle-specific
       sections needed beyond existing FR/SC structure.
  - ✅ .specify/templates/tasks-template.md — Not edited in this pass; task
       categorization (auth/data-provenance/skill-workflow) emerges naturally
       from principles. Re-check during first /speckit-tasks run.
  - ✅ CLAUDE.md — Already documents PKCE, ${CLAUDE_PLUGIN_DATA}, committed
       build artifacts, version-sync. Aligned with v1.0.0; no edit required.
  - ✅ README.md — Aligned with v1.0.0 (privacy section, requirements,
       in-place vs. new-playlist default). No edit required.

Follow-up TODOs: (none)
-->

# Spotify Set Reorder Constitution

## Core Principles

### I. Skill-First Workflow Design

Every user-facing capability of this plugin MUST ship as a Claude Code skill whose
`SKILL.md` is the source of truth for the workflow. The skill body — not external
docs, not chat improvisation — is the product. Skills MUST be designed with
explicit, named checkpoints so the user can interrupt, ask for variations, or
swap individual items before any write to a remote service. Helper scripts (Bash,
Python, Node) exist only to perform operations that the skill cannot accomplish
through the bundled MCP server or built-in tools; they MUST NOT carry product
logic that belongs in the skill body.

Rationale: The skill *is* the contract with the user. Logic hidden in scripts
or chat is unreviewable and untestable; logic in `SKILL.md` can be diffed,
versioned, and audited.

### II. Verifiable Data Provenance (NON-NEGOTIABLE)

Every track-level data point that influences sequencing decisions (BPM, key,
Camelot code, energy estimate, etc.) MUST carry a `source` field declaring how
it was obtained. The accepted values are `websearch`, `partial`, `estimated`,
and `unknown`. The system MUST NOT fabricate numeric values to fill gaps:
unknowns stay marked `unknown` and surface to the user before any write. When
public-database lookups return nothing, LLM estimation is permitted only when
tagged `estimated`, and the user MUST be told how many tracks fell back to
estimation before the reorder is applied.

Rationale: The whole product is sequencing on top of public-database signals
plus cultural reading. Faked numbers silently corrupt the output and destroy
user trust. A `source` field per track is the cheapest possible audit trail.

### III. Privacy by Default

User credentials and personal data MUST remain on-device. The plugin MAY make
network calls only to: (a) Spotify Web API for reading/modifying the user's own
playlists, and (b) Claude Code's built-in WebSearch for BPM/key/cultural
lookups. No analytics, telemetry, crash reporting, or third-party API calls are
permitted from any component of this plugin. OAuth MUST use PKCE — no client
secret is captured, stored, or transmitted. Tokens MUST be persisted only under
the harness-provided `${CLAUDE_PLUGIN_DATA}` path; hardcoded token paths are
forbidden in code, skill bodies, and helper scripts.

Rationale: Users hand this plugin write access to their Spotify libraries. A
zero-telemetry posture and a PKCE-only auth path keep the blast radius of a
compromise — ours or a dependency's — to the user's own machine.

### IV. Reversible Writes with Explicit Consent

The default outcome of any reorder MUST be a *new* playlist (e.g.,
`"<original name> — reordered"`), leaving the source playlist intact.
In-place mutation of an existing playlist is allowed only when (a) the user
owns the playlist (verified via ownership check), and (b) the user has
explicitly opted in for this run. Before any irreversible write, the skill
MUST emit a backup of the prior track list to disk so the previous order can
be reconstructed by the user. Destructive flags (`--force`, `--no-verify`, and
analogous bypasses) MUST NOT be added to helper scripts without an explicit,
per-flag rationale in this constitution.

Rationale: A playlist is a curated artifact users care about. The plugin
operates on it via a single REPLACE call; one bad sequence with no backup is a
permanent loss of order. Reversibility is the floor, not a feature.

### V. Versioned, Reproducible Distribution

`plugins/spotify-set-reorder/.claude-plugin/plugin.json` and
`.claude-plugin/marketplace.json` MUST carry identical `version` values; a PR
that changes one without the other MUST NOT merge. Build artifacts under
`plugins/spotify-set-reorder/servers/spotify-mcp-server/build/` MUST be
committed and current with the corresponding `src/` so end-users can run
`node build/index.js` and `node build/auth.js` without an `npm install` step.
Spotify API gotchas that this code works around (e.g., `getPlaylistTracks`
limit of 50, `/me/playlists` for creates, Audio Features endpoint restrictions,
Premium-required Developer Mode) MUST be documented in `CLAUDE.md`, not left
as silent constants. The MCP server's internal `package.json` version is not
user-visible and is independent of the plugin version.

Rationale: The install flow is "paste a URL into `/plugin` and go." That
contract breaks the instant the marketplace manifest, plugin manifest, and
build artifacts drift. Pinning all three keeps installs deterministic.

## Compatibility & API Stewardship

Spotify's Developer Mode policies and Web API surface have shifted materially
during 2024–2026 (PKCE-required for new apps, Audio Features quota lock-down,
endpoint consolidation, Premium-only Developer Mode). The plugin's bundled MCP
server is a deliberately patched fork of `marcelmarais/spotify-mcp-server`;
upstream changes MUST be reviewed against these patches before being merged.
Any newly-encountered Spotify API constraint MUST be captured in `CLAUDE.md`
under "API gotchas baked into the code" so future contributors do not
re-discover it the hard way. When a Spotify API breakage is detected in the
wild, a patch release (Principle V, semver PATCH) is the minimum response.

## Development Workflow

- **Source of truth for end-user setup**: `plugins/spotify-set-reorder/skills/setup/SKILL.md`.
  The legacy `references/setup.md` describes the upstream secret-based flow and
  MUST NOT be used as the setup reference for plugin users.
- **Token path**: always `${CLAUDE_PLUGIN_DATA}/spotify-config.json`. Code,
  skills, and scripts that need it MUST read it from the environment.
- **MCP edits**: edit `servers/spotify-mcp-server/src/`, then run
  `npm run build` and commit the rebuilt `build/{index,auth}.js`. Lint with
  `npm run lint` and typecheck with `npm run typecheck` before commit.
- **Onboarding test loop**: `scripts/dev-reset.sh` is the canonical way to wipe
  per-plugin state and re-test the install/setup flow. Do not invent ad-hoc
  cleanup steps that bypass it.
- **Per-run cache**: `/tmp/enriched.json` is keyed by `playlist.id`. Code that
  reads it MUST validate the cached `playlist.id` against the current request
  and discard mismatches; reusing stale enrichment is a known bug.
- **Constitution Check gate** (per `.specify/templates/plan-template.md`):
  every plan MUST verify alignment with all five principles before Phase 0
  research and again after Phase 1 design. Deviations MUST be recorded in
  the plan's Complexity Tracking table with explicit justification.

## Governance

This constitution supersedes ad-hoc conventions, individual preference, and
prior informal practice within this repository. Amendments follow these rules:

- **Proposal**: open a PR that edits this file and updates the Sync Impact
  Report at the top. The PR description MUST state the bump type (MAJOR /
  MINOR / PATCH) and the reasoning.
- **Versioning policy**:
  - MAJOR: removing a principle, redefining one in a backward-incompatible
    way, or removing a governance rule.
  - MINOR: adding a principle or section, or materially expanding existing
    guidance.
  - PATCH: clarifications, wording, typo fixes, non-semantic refinements.
- **Compliance review**: every PR review MUST verify the change does not
  violate the principles. Violations require either a fix or an explicit
  Complexity Tracking entry in the relevant plan, justified against the
  Simpler Alternative Rejected column.
- **Runtime guidance**: contributors SHOULD treat `CLAUDE.md` as the runtime
  companion to this constitution. `CLAUDE.md` describes *how* things are
  wired; this constitution describes *what must remain true*.

**Version**: 1.0.0 | **Ratified**: 2026-05-18 | **Last Amended**: 2026-05-18
