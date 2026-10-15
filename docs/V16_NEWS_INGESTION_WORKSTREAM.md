# V16 — News ingestion + editorial approval

## Release position

- V15 remains `CLOSED / RELEASE BASELINE CLEAN` at `f5c3b3ee545b32440f0c91b1365c98f28a006486`.
- V16 is a functional release line. It is not a visual-polish release.
- All V16 work is developed outside `ui-wow-production` and must not modify V15 directly.

## Workstream 1 goal

Build a safe newsroom pipeline for external official sources:

`Source -> Discover -> Normalize -> Deduplicate -> Review queue -> Edit -> Approve/Reject -> Publish -> Provenance/Audit`

No external item may be auto-published.

## Initial official sources

1. Cổng Thông tin điện tử Bộ Khoa học và Công nghệ — `https://mst.gov.vn/`
2. Cổng Thông tin điện tử Chính phủ — `https://chinhphu.vn/`

The initial implementation uses `html_discovery` entry points. RSS/API endpoints must be verified before being configured. Source-specific extraction must be isolated behind adapters so markup changes do not affect the editorial workflow.

## Data model

### `news_sources`
Configuration and fetch state for external sources. Important rules:

- `requires_editorial_review = 1` is mandatory.
- source can be disabled without deleting history.
- attribution mode is stored per source.
- fetch errors are retained separately from article state.

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

Publication is only allowed from `approved`. `published` is terminal.

### `article_provenance`
Permanent source attribution attached to the published `articles` record. Provenance survives later source configuration changes.

## Deduplication policy

First-pass duplicate detection is deterministic and conservative:

1. canonical URL after removing fragments and common tracking parameters;
2. exact normalized title match;
3. source-specific external identifier when an adapter exposes one;
4. later phase: optional semantic similarity, only as an editorial hint, never as an automatic delete rule.

## Editorial policy

- External content is discovery material, not a publication-ready article.
- Editors may rewrite title/excerpt/body before approval.
- Original source URL and source publication time are preserved.
- Attribution is rendered from provenance data.
- Rejecting an item does not delete the ingest record.
- Rejected items may return to `pending`/`editing` if an editor reopens them.
- Publishing must create/update both `articles` and `article_provenance` atomically in the backend phase.

## Security / access direction

The current milestone establishes schema and business rules only. Admin actions will later be protected by Cloudflare Access and server-side authorization. Public API surfaces must never expose unpublished body content or internal review notes.

## Delivery phases

### V16.1 — foundation (current)

- D1 schema for sources, ingest runs/items, review queue and provenance.
- Initial official source registry.
- URL/title normalization and deterministic dedupe key.
- Review state machine.
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
- transaction-safe publish operation;
- audit log records;
- role checks.

### V16.4 — newsroom admin UI

- source health/status;
- pending queue;
- duplicate flag;
- side-by-side source + editable draft;
- category selection;
- approve/reject/publish controls;
- history and provenance view.

### V16.5 — scheduled ingestion

- Cloudflare scheduled trigger;
- per-source cadence;
- concurrency/idempotency guard;
- operational metrics and alertable failures.

## Acceptance gates for Workstream 1

- External source cannot publish without approval.
- Duplicate canonical URL cannot create a second active queue item.
- Every published external article has provenance.
- Failed source fetch does not affect public site availability.
- Source can be disabled independently.
- Review state changes are auditable.
- Public article output never exposes internal editor notes.
- Unit tests and migration verification pass before the workstream is promoted.
