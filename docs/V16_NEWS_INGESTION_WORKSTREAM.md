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

### Manual review — default

`Discover -> Normalize -> Deduplicate -> Pending -> Edit -> Approve/Reject -> Publish`

### Policy-driven auto-publish — optional

`Discover -> Normalize -> Deduplicate -> Pending -> Policy Check -> Auto Approve -> Publish`

Auto-publish does not bypass the review queue. The system records a policy-driven approval, including the policy snapshot, before running the same publication/provenance path used by manual publishing.

## CMS settings model

### Global newsroom settings

Backed by `news_workflow_settings`:

- `Auto publish`: ON/OFF — default OFF;
- minimum trusted source level — default `official`;
- maximum auto-published items per ingest run — default 10;
- require source attribution — default ON;
- require source publication timestamp — default OFF.

### Per-source override

Each source has `publication_mode`:

- `inherit` — follow global newsroom policy;
- `manual` — always require a human editor;
- `auto` — eligible for automatic publication when the global switch is ON and all guardrails pass.

## Initial official sources and verified adapters

### Bộ Khoa học và Công nghệ

- Homepage: `https://mst.gov.vn/`
- Verified feed: `https://mst.gov.vn/rss/tin-tuc-su-kien.rss`
- Adapter: `rss`
- Allowed host: `mst.gov.vn`
- Discovery payload: title, link, summary and publication time only.

### Cổng Thông tin điện tử Chính phủ

- Entry point: `https://chinhphu.vn/`
- Adapter: `html`
- Allowed article hosts: `chinhphu.vn`, `baochinhphu.vn`
- Discovery payload: article URL and title only at this phase.

Source-specific extraction is isolated behind adapters so markup/feed changes do not affect the editorial workflow.

## Data model

### `news_sources`

- source can be disabled without deleting history;
- attribution mode is stored per source;
- fetch errors are retained separately from article state;
- `publication_mode` controls per-source manual/auto behavior;
- all items still enter the editorial workflow for traceability.

### `news_workflow_settings`

Seeded conservatively:

- auto-publish OFF;
- official sources only;
- attribution required;
- max 10 auto-published items per ingest run.

### `news_ingest_runs`

One record per fetch execution with fetched/new/duplicate/queued/error counts.

### `news_ingest_items`

Raw discovery metadata: source URL, canonical URL, normalized title, dedupe key, source timestamps and metadata.

### `news_review_queue`

Statuses:

- `pending`
- `editing`
- `approved`
- `rejected`
- `published`

Publication is only allowed from `approved`. Auto mode first records an automatic approval with `approval_mode = auto`, `policy_snapshot_json` and `auto_publish_reason`.

### `article_provenance`

Permanent source attribution linked to the published `articles` record.

## Deduplication policy

1. canonical URL after removing fragments/tracking parameters;
2. exact normalized-title match;
3. source-specific external identifier when available;
4. optional semantic similarity later, as an editorial hint only.

A probable duplicate is never auto-published.

## Auto-publish guardrails

An item can auto-publish only when all required checks pass:

1. global auto-publish enabled;
2. source active;
3. source publication mode is not `manual`;
4. trust level meets threshold;
5. no duplicate detected;
6. valid title;
7. valid canonical URL;
8. required attribution present;
9. source publication timestamp present when configured;
10. per-run auto-publish cap not reached.

Any failure falls back to manual review. No item is discarded merely because auto-publish was denied.

## Source adapter safety

V16.2 adapters enforce:

- explicit source ID registry;
- HTTPS-only URLs;
- host allowlist per source;
- response-size cap;
- fetch timeout;
- limited item count per source run;
- canonical URL normalization;
- duplicate URL/title removal before queueing;
- no full-article republication during discovery.

## Security / access direction

CMS write actions will later be protected by Cloudflare Access and server-side authorization. Public API surfaces must not expose unpublished body content, editor notes or privileged newsroom settings.

Only authorized CMS roles may change auto-publish settings. Settings changes must be audited.

## Delivery phases

### V16.1 — foundation — complete

- D1 source/ingest/review/provenance schema;
- auto-publish settings schema, default OFF;
- per-source publication policy;
- normalization/dedupe/state machine;
- auto-publish eligibility guardrails;
- unit tests;
- read-only workflow manifest.

### V16.2 — source adapters — current

- source adapter registry/interface — complete;
- verified Bộ KH&CN RSS adapter — complete;
- Cổng Chính phủ HTML discovery adapter — complete;
- host allowlists — complete;
- safe fetch timeout and response-size limits — complete;
- extraction of metadata only — complete;
- source parser unit tests — complete;
- ingest persistence/retry orchestration — next inside V16.2/V16.3 boundary.

### V16.3 — review queue backend

- D1 repository layer;
- ingest-run/item persistence;
- queue/list/detail endpoints;
- approve/reject/edit operations;
- transaction-safe manual publish;
- transaction-safe auto-approve + publish;
- policy snapshot persistence;
- audit logs;
- role checks.

### V16.4 — newsroom admin UI

- source health/status;
- pending queue;
- duplicate flag;
- source + editable draft view;
- category selection;
- approve/reject/publish controls;
- history/provenance;
- `Settings > Newsroom` controls for auto-publish and per-source modes.

### V16.5 — scheduled ingestion

- Cloudflare scheduled trigger;
- per-source cadence;
- concurrency/idempotency guard;
- auto-publication policy evaluation;
- operational metrics and alertable failures.

## Acceptance gates for Workstream 1

- Manual review remains the default installation state.
- Auto-publish cannot operate while the global switch is OFF.
- A source explicitly set to `manual` cannot auto-publish.
- Auto-publish failure falls back to manual review.
- Duplicate canonical URLs cannot create a second active queue item or auto-publish.
- Every published external article has provenance.
- Every auto-published article records approval mode and policy snapshot.
- Failed source fetch does not affect public site availability.
- Source can be disabled independently.
- Review and policy-setting changes are auditable.
- Public output never exposes internal editor notes.
- Unit tests, migration verification, typecheck and production build must pass before promotion.
