# IAICT Portal — PCS Solo integration

**PCS:** Universal 3.2.0; **status:** bootstrap checkpoint (revision 2). The initial tracking change is [PR #40](https://github.com/ntdung-tds/iaict-portal/pull/40), based on `feat/staging-native-login-r2-20261030`. Verify actual merge and latest HEAD before declaring activation on a chosen branch.

## Goal and boundaries

Use PCS Universal in **Solo** mode. No separate PCS product, second canonical state, contributor registry, Gateway, Github Inbox or daemon. Each project session reads `pcs/MOMENT.md`, verifies `pcs/STATE.json` revision and actual HEAD, reads only the relevant backlog/task/evidence, and saves an honest checkpoint in its authorized branch.

This bootstrap modifies **tracking files only**. It does not edit Next.js, Cloudflare Workers, Access, D1, R2, CI, SRS, staging or production and is not an end-to-end certification of PCS or the application.

## Single source of truth per concern

| Concern | Existing authority (do not duplicate) | PCS behavior |
| --- | --- | --- |
| Current development | [PR #36](https://github.com/ntdung-tds/iaict-portal/pull/36), active GitHub Issues/PRs | Map only verified task status; review branch SHA on resume |
| SRS baseline | `docs/requirements/SRS.md`, **FROZEN / UNAPPROVED** | Read-only until the Owner explicitly says “chốt SRS” |
| Requirement changes | `docs/requirements/README.md` and existing module-specific `thaydoi.md` | Link tasks to existing CHG IDs; **do not** create duplicate `pcs/SRS_CHANGES.md` by default |
| QA cases | `docs/qa/IAICT_TEST_CASES.csv` | Keep source test-case IDs; READY is not PASS |
| QA runs | `docs/qa/IAICT_TEST_RUNS.md` and actual GitHub CI/Cloudflare proof | Keep immutable SHA and true PASS/FAIL/BLOCKED/NOT_RUN status |
| Visual QA evidence | Private Google Drive QA folders already linked in the test registry | No QA image/video/traces on GitHub |
| Source handoff | [Issue #38](https://github.com/ntdung-tds/iaict-portal/issues/38) | Only after Owner explicitly says “bàn giao” |
| Initial PCS backlog | [Issue #37](https://github.com/ntdung-tds/iaict-portal/issues/37) (IAM), [Issue #39](https://github.com/ntdung-tds/iaict-portal/issues/39) (CMS R2) | Both `PLANNED`, HIGH-risk; unverified live acceptance; no implied approval |

## Security and governance

- **PUBLIC repository**: keep the PCS checkpoint strictly PUBLIC-safe. `public_content_reviewed=false` deliberately blocks any implied privileged PCS public-repo operation. Do not include secrets, identities, restricted SRS, internal approvals or sensitive evidence. Owner approval for IAM/production/security changes must be authenticated under applicable rules, never inferred from normal chat feedback.
- PCS Solo has no contributor registration or self-approval bypass. GitHub PR review and branch protections continue to apply; use read-before-write / conditional blob SHA checks and do not force-update any branch.
- No automatic deployment, runtime migration, SRS synchronization, delivery of source to Drive, or promotion to production.

## Adoption and continued operation

1. Verify PR #40 is merged into the chosen **active development branch**, review changed files and actual CI; if still pending, don't call its state canonical.
2. Reconcile PR #36, Issue #37 and Issue #39 with the actual code, QA case/run records and Worker SHA; update PCS backlog and product/architecture maps only from verified information.
3. For changes: choose an active task, branch/PR per risk, implement, test appropriate layers, save `STATE` revision + updated `MOMENT` consistently. **Task technical completion ≠ feature/flow/release acceptance**.
4. Keep staging-first, QA evidence, business-level Owner feedback and separate verified approval for production/security-sensitive changes.

### Resume command

`Tiếp tục dự án IAICT Portal theo PCS, sử dụng trạng thái mới nhất trên GitHub.`
