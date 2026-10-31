# IAICT Portal — PROJECT PROGRESS (LIVING EVIDENCE LOG)
**Progress record ID:** `PROGRESS-IAICT-20261031-01` · **Observed:** 2026-10-31T19:46:47+07:00 · **Planning:** [PROJECT_PLAN](PROJECT_PLAN.md) · **Resume:** [CHECKLIST_MOMENT](CHECKLIST_MOMENT.md).
**Verdict:** ACTIVE; NOT FULLY ACCEPTED; no production promotion, no Access cutover, no source handover.

## Scope counters (not global project %)
| Scope | Done / Total | In progress | Blocked | Not started | Meaning |
|---|---:|---:|---:|---:|---|
| CMS/CRM-1 **scoped checklist** | **5/10** | 1 | 2 | 2 | Includes narrow infrastructure / QA artifact checkpoints, not full CMS release |
| IAM v1.2 **20 proposed target outcomes** | **0/20 full acceptance** | 5 | 1 | 14 | Prototype/partial code exists; no assertion that all 20 are approved requirements |
| QA case catalog | **78 documented** | — | — | — | Prepared cases; 78 is not PASS count |
| Authorized live 7-role authentication | **0/7 role E2E proven** | — | 7 | — | Eight disabled D1 fixtures are not valid logins |

## Verified chronology — append only (new rows at bottom)
| Moment (ICT) | Work/evidence | Outcome / limits | Next |
|---|---|---|---|
| 2026-10-31 prior batch | [PR #36](https://github.com/ntdung-tds/iaict-portal/pull/36): IAM source `2a76deb5`, staging deployment `754b0509-e754-410c-8dff-46015d162a89`; [RUN-01](../qa/IAICT_TEST_RUNS.md) | native-auth and account security foundation staged; real login remains NOT_RUN | credential-safe, real-role acceptance later |
| 2026-10-31 prior batch | TOTP primitive `645a98d5`, [CI #41192956639](https://github.com/ntdung-tds/iaict-portal/actions/runs/41192956639), [RUN-02](../qa/IAICT_TEST_RUNS.md) | 533/533 suite PASS on that SHA; **algorithm only**, MFA not enabled | KDF compatibility, factor schema, recovery and ADR |
| 2026-10-31 prior batch | 8 disabled staging role fixtures, [RUN-03](../qa/IAICT_TEST_RUNS.md), [QA account inventory](https://docs.google.com/document/d/1OV8F7b1GtF2gV84eEQ8AphsdHQTEmGJuF8kwf3SxnBA/edit) | D1 fixtures PASS; real 7-role login NOT_RUN; Browser Rendering HTTP 429 BLOCKED | controlled IAICT QA mailbox and Access |
| 2026-10-31 prior batch | [#39](https://github.com/ntdung-tds/iaict-portal/issues/39), CHG backfill IAM/R2/platform, [commit `a6afff7e`](https://github.com/ntdung-tds/iaict-portal/commit/a6afff7ecb0ed27bc4bddeb4374e2fe333312745) | reference logs updated; no upload E2E / no production write | CMS Media workstream independent |
| 2026-10-31T19:46:47+07:00 | Reviewed user IAM v1.2 (27 pages; historical base `5d29e28b`) and current docs/CI; [portal-ci #41201324622](https://github.com/ntdung-tds/iaict-portal/actions/runs/41201324622); [staging gate #41201324539](https://github.com/ntdung-tds/iaict-portal/actions/runs/41201324539) | both observed workflows **PASS on a6afff7e**; DOES NOT prove live-role/MFA. Checklist Moment governance initiated; no runtime/deploy change | next checkpoint CMS-08 / S2; verify CI after documentation commit |

## Current blockers / risk register pointers
- **BLOCKED #34:** authenticated 7-role & 2-admin browser acceptance needs IAICT-controlled inbox, Cloudflare Access, vault-backed test identities. Never spoof or enable synthetic fixture accounts solely to get green tests.
- **RISK / pending:** full MFA, reset/recovery, scoped permission/IDOR, KDF workerd >100000 verification, R2 media upload, offboarding and personal-data safeguards; uploaded research report does NOT resolve implementation.
- **DEFERRED:** production + Access removal, SRS approval, full-source Drive handoff [#38](https://github.com/ntdung-tds/iaict-portal/issues/38). Different explicit commands apply.
- **Regression test:** any docs/code change must rerun `portal-ci`/gate on exact new SHA; status from older SHA does not transfer.

## Cross-chat handoff
Open [CHECKLIST_MOMENT](CHECKLIST_MOMENT.md), choose **latest timestamped snapshot**, compare GitHub PR HEAD/CI and Cloudflare runtime, resume **CMS-08 S2** or record a new evidence-based decision when blocked. No need to infer progress from prose in preceding chats. Keep old progress rows append-only, add new row and moment snapshot when switching tasks.
