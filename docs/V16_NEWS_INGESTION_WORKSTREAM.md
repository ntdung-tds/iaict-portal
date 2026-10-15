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

### Per-source publication override

Each source has `publication_mode`:

- `inherit` — follow global newsroom policy;
- `manual` — always require a human editor;
- `auto` — eligible for automatic publication when the global switch is ON and all guardrails pass.

### Per-source scheduled ingestion

Each source also stores:

- `schedule_enabled`;
- `schedule_interval_minutes` — allowed 15–1440 minutes;
- `schedule_retry_minutes` — allowed 15–360 minutes;
- `next_scheduled_at`;
- `last_scheduled_at`.

The Worker uses one frequent Cron tick. Source cadence remains data-driven in D1 so operators can change source schedules without redeploying the Worker.

## Initial official sources and verified adapters

### Bộ Khoa học và Công nghệ

- Homepage: `https://mst.gov.vn/`
- Verified feed: `https://mst.gov.vn/rss/tin-tuc-su-kien.rss`
- Adapter: `rss`
- Allowed host: `mst.gov.vn`
- Discovery payload: title, link, summary and publication time only.
- Default IAICT category: `Khoa học & Công nghệ`.
- Initial scheduled cadence: every 30 minutes; retry after 15 minutes.

### Cổng Thông tin điện tử Chính phủ

- Entry point: `https://chinhphu.vn/`
- Adapter: `html`
- Allowed article hosts: `chinhphu.vn`, `baochinhphu.vn`
- Discovery payload: article URL and title only at this phase.
- Default IAICT category: `Chính sách & Văn bản`.
- Initial scheduled cadence: every 60 minutes; retry after 15 minutes.

Source-specific extraction is isolated behind adapters so markup/feed changes do not affect the editorial workflow.

## Data model

### `news_sources`

- source can be disabled without deleting history;
- attribution mode is stored per source;
- fetch errors are retained separately from article state;
- `publication_mode` controls per-source manual/auto behavior;
- `default_category_id` provides a valid category for policy-driven publication;
- scheduled cadence and retry policy are stored per source;
- all items still enter the editorial workflow for traceability.

### `news_workflow_settings`

Seeded conservatively:

- auto-publish OFF;
- official sources only;
- attribution required;
- max 10 auto-published items per ingest run.

### `news_ingest_runs`

One record per fetch execution with fetched/new/duplicate/queued/error counts and auto-publish statistics in metadata.

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

### `news_publication_claims`

Short-lived race-safety guard used inside the same D1 batch as article publication. A concurrent/stale writer fails before article or provenance side effects are committed.

### `news_scheduler_claims`

One lease per source prevents overlapping Cron deliveries from fetching the same source concurrently. Expired leases can be recovered safely.

### `news_scheduler_runs`

One row per scheduled delivery records:

- unique `scheduled_key` for idempotency;
- Cron expression;
- due/claimed/succeeded/failed/skipped counts;
- start/finish timestamps;
- source-level result metadata.

### `article_provenance`

Permanent source attribution linked to the published `articles` record.

## External publication content policy

The ingestion adapter does not copy the full external article. A published IAICT external-source article contains:

- the reviewed or policy-approved title;
- the reviewed/source summary when available;
- source attribution;
- a canonical link to the original article.

This keeps the source of record explicit and avoids silently republishing full third-party content.

## Deduplication policy

1. canonical URL after removing fragments/tracking parameters;
2. exact normalized-title match, including across configured sources;
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
10. per-run auto-publish cap not reached;
11. a valid default/suggested category exists.

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

## Backend/API boundary

V16.3 adds a Cloudflare D1 binding named `DB` and a repository layer that persists ingestion and review state.

Protected CMS endpoints:

- `POST /api/admin/news/ingest` — manually trigger one configured source;
- `GET /api/admin/news/review?status=pending&limit=30` — list review queue items;
- `POST /api/admin/news/review/action` — edit, approve, reject or publish;
- `GET /api/admin/news/settings` — settings, sources, queue counts and recent scheduler runs;
- `POST /api/admin/news/settings` — global automation settings and per-source publication/schedule settings.

### Role model

Newsroom-specific roles are seeded:

- `news_admin`
- `news_editor`
- `news_reviewer`

Legacy broad role codes `admin`, `editor`, `reviewer` are also accepted for compatibility.

Editor actions and reviewer/publication actions are authorized separately.

### Cloudflare Access boundary

Admin APIs fail closed when Cloudflare Access identity headers are absent. Production deployment must protect `/admin/*` and `/api/admin/*` with a Cloudflare Access application/policy. The backend additionally maps the authenticated email to an active `admin_users` row and verifies database roles.

## Transaction-safe publication

Manual and auto publication use D1 `batch()` so the following operations commit or roll back together:

1. acquire a publication claim;
2. record auto approval when applicable;
3. create the `articles` row;
4. create `article_provenance`;
5. move the review item to `published`;
6. mark the ingest item `imported`;
7. write `audit_logs`;
8. release the claim.

A trigger on `news_publication_claims` checks the expected queue status before any publication side effect.

## Scheduled ingestion architecture

Cloudflare invokes the custom vinext Worker `scheduled()` handler every 15 minutes in UTC.

Each tick performs:

`Cron -> scheduled_key claim -> query due active sources -> per-source lease -> ingestNewsSource() -> policy/manual queue -> update next due -> release lease -> scheduler metrics/audit`

Operational guarantees:

- the same Cron delivery is idempotent via unique `scheduled_key`;
- concurrent deliveries cannot claim the same source at the same time;
- only active, schedule-enabled and due sources run;
- success uses the configured normal interval;
- failure uses a shorter configured retry interval;
- one source failure does not stop another source;
- scheduled ingestion reuses the exact V16.3 ingest/publication pipeline;
- scheduler failures do not affect public request handling;
- recent scheduled runs are available to the protected Newsroom overview API.

## Delivery phases

### V16.1 — foundation — complete

- D1 source/ingest/review/provenance schema;
- auto-publish settings schema, default OFF;
- per-source publication policy;
- normalization/dedupe/state machine;
- auto-publish eligibility guardrails;
- unit tests;
- read-only workflow manifest.

### V16.2 — source adapters — complete

- source adapter registry/interface;
- verified Bộ KH&CN RSS adapter;
- Cổng Chính phủ HTML discovery adapter;
- host allowlists;
- safe fetch timeout and response-size limits;
- extraction of metadata only;
- source parser unit tests.

### V16.3 — review queue backend — complete

- Cloudflare D1 `DB` binding;
- D1 repository layer;
- ingest-run/item persistence;
- cross-source duplicate detection;
- protected ingest/review APIs;
- edit/approve/reject operations;
- transaction-safe manual publish;
- transaction-safe auto-approve + publish;
- race-safe publication claims;
- policy snapshot persistence;
- provenance and audit logs;
- newsroom role checks;
- fail-closed Cloudflare Access identity bridge;
- backend/auth transaction-shape unit tests.

### V16.4 — newsroom admin UI — complete

- `/admin/news` control center;
- source health/status dashboard;
- pending/editing/approved/rejected/published views;
- source + editable draft view;
- category selection;
- approve/reject/publish controls;
- source/provenance visibility;
- `Settings > Newsroom` global auto-publish and per-source publication controls;
- backend audit for settings changes;
- responsive desktop/tablet/mobile layout.

### V16.5 — scheduled ingestion + operations — complete

- custom vinext Worker entrypoint preserving normal fetch handling;
- Cloudflare Cron Trigger every 15 minutes UTC;
- D1-managed per-source cadence and retry backoff;
- scheduler delivery idempotency;
- per-source leases and stale-lease recovery;
- source failure isolation;
- reuse of V16.3 ingest/auto-publication policy pipeline;
- scheduler run metrics and audit history;
- protected overview exposes recent operational scheduler runs;
- schedule-setting validation tests;
- scheduler helper tests;
- Vinext compatibility, TypeScript, unit tests, production build and Cloudflare build-output validation PASS.

## Acceptance gates for Workstream 1

- Manual review remains the default installation state.
- Auto-publish cannot operate while the global switch is OFF.
- A source explicitly set to `manual` cannot auto-publish.
- Auto-publish failure falls back to manual review.
- Duplicate canonical URLs cannot create a second active queue item or auto-publish.
- Every published external article has provenance.
- Every auto-published article records approval mode and policy snapshot.
- Concurrent/stale publication attempts cannot create duplicate articles.
- Duplicate Cron delivery cannot create a second scheduler execution for the same scheduled minute.
- Two concurrent scheduler executions cannot ingest the same source under a live lease.
- Failed source fetch does not affect other sources or public site availability.
- Source can be disabled independently.
- Source schedule can be disabled independently.
- Review, publication, settings and scheduler actions are auditable.
- Admin APIs fail closed without authenticated CMS identity/role.
- Public output never exposes internal editor notes.
- Unit tests, migration verification, typecheck, production build and Cloudflare build-output validation must pass before promotion.

## Next release gate

Workstream 1 is code-complete on the V16 functional branch. The next step is **staging integration**:

1. provision/bind the staging D1 database and apply migrations 0012–0018;
2. configure Cloudflare Access for `/admin/*` and `/api/admin/*`;
3. seed at least one authorized newsroom administrator;
4. deploy V16 to staging;
5. run manual ingest, review, manual publish and auto-publish smoke tests;
6. invoke the local/remote scheduled handler and verify scheduler run metrics;
7. keep V15 untouched until staging acceptance is complete.
