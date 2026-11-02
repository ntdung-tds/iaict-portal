# IAICT Portal — PCS Solo integration proposal

**Status:** DRAFT / no merge / no deployment. **Baseline:** `feat/staging-native-login-r2-20261030`. **Reference:** [PCS Universal 3.2.0](https://github.com/ntdung-tds/pcs-universal/blob/main/START_HERE.md).

## Goal and boundaries

Adopt existing PCS Universal **Solo behavior**, not a second PCS variant, service, GitHub App, coordinator or agent registry. A single AI plans, implements, reviews evidence and stores a coherent STATE/Moment checkpoint. Do not import unverified historical work as ACCEPTED, and do not introduce workflow gates merely for adoption.

This PR only proposes a minimal state and resume snapshot. It **does not** modify Next.js, Cloudflare Workers, Access, D1, R2, CI, branch policies or SRS, and does not deploy to staging or production. It does not claim the PCS runtime end-to-end integration has passed.

## Existing sources remain authoritative

| Concern | Existing authority (do not duplicate) | PCS use |
| --- | --- | --- |
| Current development | Draft [PR #36](https://github.com/ntdung-tds/iaict-portal/pull/36), related open Issues/PRs | Reference in task/feature progress after verifying branch HEAD |
| Requirement baseline | `docs/requirements/SRS.md` — FROZEN / UNAPPROVED | Read-only; Owner-only decision to “chốt SRS” |
| Requirement changes | `docs/requirements/README.md` and each module’s `thaydoi.md` | Link task/feature ID to existing CHG ID; avoid second parallel canonical ledger |
| QA case management | `docs/qa/IAICT_TEST_CASES.csv` | Link case IDs, never reinterpret READY as PASS |
| QA executions | `docs/qa/IAICT_TEST_RUNS.md` and actual GitHub CI/Cloudflare evidence | Link immutable run SHA, distinguish unit/browser/live/NOT_RUN |
| QA images/video | Private Google Drive QA folders already recorded with the test cases | Do not upload evidence media to GitHub |
| Source-code handoff | [Issue #38](https://github.com/ntdung-tds/iaict-portal/issues/38) | Only after separate explicit Owner “bàn giao” request |
| Live IAM/R2 work | [Issue #37](https://github.com/ntdung-tds/iaict-portal/issues/37), [Issue #39](https://github.com/ntdung-tds/iaict-portal/issues/39) | Backlog candidates; not automatically accepted |

## Next safe adoption steps

1. Review this draft and verify that the project can lawfully keep PUBLIC-only PCS tracking metadata. The GitHub repo is PUBLIC; do **not** mark `public_content_reviewed=true` or enable privileged PCS operators based on this draft alone. Private content, credentials, real identities, private test evidence, internal SRS or sensitive approval provenance must stay out of this public repo.
2. Reconcile actual development branch, stacked PRs, Issues and QA files. Populate task/feature/flow/release IDs only from verified work, with status and dependency evidence. No bulk backfill as ACCEPTED.
3. Review and merge the PCS tracking PR into the **chosen active development baseline** without triggering deployment. Once merged, use `pcs/MOMENT.md` as the short resume entrypoint and `pcs/STATE.json` as the canonical project-progress snapshot; verify revision and HEAD before every subsequent write.
4. Continue the existing project workflow: staging-first, technical QA, Owner reviews outcomes, production only with explicit approval. Existing per-module requirement change logs remain canonical; any future use of PCS `pcs/SRS_CHANGES.md` helpers requires a deliberate adapter/mapping decision to prevent double-writing.

## Meaning of status

**DRAFT** here means tracking is proposed, **not activated**. No existing project change or test has been retroactively accepted, and no production/staging operation was authorized.
