# V16 — News ingestion + editorial approval

## Release position

- V15 remains `CLOSED / RELEASE BASELINE CLEAN` at `f5c3b3ee545b32440f0c91b1365c98f28a006486`.
- V16 is a functional release line. It is not a visual-polish release.
- All V16 work is developed outside `ui-wow-production` and must not modify V15 directly.

## Workstream 1 goal

Build a safe newsroom pipeline for external official sources:

`Source -> Discover -> Normalize -> Deduplicate -> Pending -> Edit/Policy Check -> Approve/Reject -> Publish -> Provenance/Audit`

Manual review is the default. Auto-publish is an optional CMS policy for low-staff operations and is OFF by default.

## Publication modes

V16 supports two practical operating modes without changing the ingestion pipeline.

### 1. Manual review — default

`Discover -> Normalize -> Deduplicate -> Pending -> Edit -> Approve/Reject -> Publish`

A human editor reviews the item before publication.

### 2. Policy-driven auto-publish — optional

`Discover -> Normalize -> Deduplicate -> Pending -> Policy Check -> Auto Approve -> Publish`

Auto-publish does **not** bypass the review queue. The system records an automatic approval with the policy snapshot that caused the decision, then performs the same publication/provenance operation used by manual publishing.

This allows the Institute to operate with a small editorial team while retaining traceability.

## CMS settings model

### Global newsroom settings

The CMS will expose a newsroom settings screen backed by `news_workflow_settings`:

- `Auto publish`: ON/OFF — default OFF.
- minimum trusted source level — default `official`.
- maximum auto-published items per ingest run — default 10.
- require source attribution — default ON.
- require source publication timestamp — default OFF.

The global switch is a master safety gate. If it is OFF, no source may auto-publish.

### Per-source override

Each source has `publication_mode`:

- `inherit` — follow the global newsroom policy;
- `manual` — always require a human editor;
- `auto` — eligible for automatic publication when the global switch is ON and all guardrails pass.

Initial official sources use `inherit`, so turning on global auto-publish is still an explicit CMS action.

## Initial official sources

1. Cổng Thông tin điện tử Bộ Khoa học và Công nghệ — `https://mst.gov.vn/`
2. Cổng Thông tin điện tử Chính phủ — `https://chinhphu.vn/`

The initial implementation uses `html_discovery` entry points. RSS/API endpoints must be verified before being configured. Source-specific extraction must be isolated behind adapters so markup changes do not affect the editorial workflow.

## Data model

### `news_sources`

Configuration and fetch state for external sources. Important rules:

- source can be disabled without deleting history;
- attribution mode is stored per source;
- fetch errors are retained separately from article state;
- `publication_mode` controls per-source manual/auto behavior;
- all items still enter the editorial workflow for traceability.

### `news_workflow_settings`

Global CMS-controlled auto-publication policy. The seeded configuration is deliberately conservative:

- auto-publish OFF;
- official sources only;
- attribution required;
- max 10 auto-published items per ingest run.

### `news_ingest_runs`

One record per fetch execution. Stores counts for fetched/new/duplicate/queued/error items and an error summary.

### `news_ingest_items`

Raw discovery records. Stores source URL, canonical URL, normalized title, dedupe key, source timestamps and raw metadata.

### `news_review_queue`

Editorial queue with state machine:

- `pending`
- `editing`
- `approved`
- `rejected`
- `published`

Publication is still only allowed from `approved`. In auto mode, the backend writes an automatic approval first, setting:

- `approval_mode = auto`;
- `policy_snapshot_json`;
- `auto_publish_reason`.

Manual review uses `approval_mode = manual`.

`published` remains terminal.

### `article_provenance`

Permanent source attribution attached to the published `articles` record. Provenance survives later source configuration changes.

## Deduplication policy

First-pass duplicate detection is deterministic and conservative:

1. canonical URL after removing fragments and common tracking parameters;
2. exact normalized title match;
3. source-specific external identifier when an adapter exposes one;
4. later phase: optional semantic similarity, only as an editorial hint, never as an automatic delete rule.

A probable duplicate is never auto-published.

## Auto-publish guardrails

An item can be automatically approved only when all required checks pass:

1. global auto-publish is enabled;
2. source is active;
3. source publication mode is not `manual`;
4. source trust level meets the configured threshold;
5. no duplicate has been detected;
6. title is valid;
7. canonical URL is valid;
8. required attribution is present;
9. source publication timestamp is present when that CMS option is enabled;
10. per-run auto-publish cap has not been reached.

If any check fails, the item remains in the manual review queue. The failure of auto-publish must never discard the item.

## Editorial policy

- External content is discovery material, not automatically assumed to be publication-ready.
- Editors may rewrite title/excerpt/body before manual approval.
- Original source URL and source publication time are preserved.
- Attribution is rendered from provenance data.
- Rejecting an item does not delete the ingest record.
- Rejected items may return to `pending`/`editing` if an editor reopens them.
- Publishing must create/update both `articles` and `article_provenance` atomically in the backend phase.
- Auto-published items must retain the exact policy snapshot used for the decision.

## Security / access direction

The current milestone establishes schema and business rules only. CMS write actions will later be protected by Cloudflare Access and server-side authorization. Public API surfaces must never expose unpublished body content, internal review notes or privileged newsroom settings.

Only authorized CMS roles may change auto-publish settings. Changing the global switch or a source publication mode must create an audit log entry.

## Delivery phases

### V16.1 — foundation (current)

- D1 schema for sources, ingest runs/items, review queue and provenance.
- Global auto-publish settings schema, default OFF.
- Per-source publication policy.
- Initial official source registry.
- URL/title normalization and deterministic dedupe key.
- Review state machine.
- Auto-publish eligibility policy and guardrails.
- Unit tests.
- Read-only workflow manifest endpoint for build/debug visibility.

### V16.2 — source adapters

- source adapter interface;
- HTML discovery adapter for each verified source;
- safe fetch limits/timeouts/user-agent policy;
- extraction of URL/title/summary/date only;
- ingest-run persistence;
- retry/error handling;
- no full-content republication during discovery.

### V16.3 — review queue backend

- D1 repository layer;
- queue/list/detail endpoints;
- approve/reject/edit operations;
- transaction-safe manual publish operation;
- transaction-safe auto-approve + publish operation;
- policy snapshot persistence;
- audit log records;
- role checks.

### V16.4 — newsroom admin UI

- source health/status;
- pending queue;
- duplicate flag;
- side-by-side source + editable draft;
- category selection;
- approve/reject/publish controls;
- history and provenance view;
- CMS Settings > Newsroom:
  - global auto-publish ON/OFF;
  - trust threshold;
  - per-run cap;
  - attribution/date requirements;
  - per-source `inherit/manual/auto` mode.

### V16.5 — scheduled ingestion

- Cloudflare scheduled trigger;
- per-source cadence;
- concurrency/idempotency guard;
- automatic publication policy evaluation;
- operational metrics and alertable failures.

## Acceptance gates for Workstream 1

- Manual review remains the default installation state.
- Auto-publish cannot operate while the global CMS switch is OFF.
- A source explicitly set to `manual` cannot auto-publish.
- Auto-publish failure falls back to the manual queue instead of dropping content.
- Duplicate canonical URL cannot create a second active queue item or auto-publish.
- Every published external article has provenance.
- Every automatically published article records `approval_mode = auto` and the policy snapshot.
- Failed source fetch does not affect public site availability.
- Source can be disabled independently.
- Review and policy-setting changes are auditable.
- Public article output never exposes internal editor notes.
- Unit tests and migration verification pass before the workstream is promoted.
