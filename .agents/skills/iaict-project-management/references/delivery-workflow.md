# Delivery, test and release — IAICT

## Small batch
1. Read status in GitHub and current Cloudflare. Identify issue/REQ and affected test IDs.
2. Prioritize P0 safety and independent increments. Group 2–4 small related tasks; isolate MFA / data boundary / recovery as a gated increment.
3. Make changes via PR, update tests in same PR. Do not alter applied D1 migration.
4. Run `npm run verify:qa`, typecheck, unit/integration, browser UI plus read-only staging acceptance as relevant.
5. For newly deployed functionality, verify it after deployment; pre-deploy staging acceptance covers **old** Worker only. Label missing post-deploy authentication checks NOT_RUN/BLOCKED.
6. Write Test Run record with exact SHA, Worker version, D1 migration count, CI URL, per-case verdict, Drive evidence link or NOT_CAPTURED.
7. Record defect → GitHub issue → fix SHA → **new** retest run. Do not replace history.

## Staging one-shot deploy
- Preconditions: GitHub CI green on exact SHA, staged acceptance green, authorized staging Worker, correct D1/R2, Cloudflare Access four admin route patterns, no high-risk unanswered defect, past version and backup bookmark retrievable.
- Set pinned build/deploy commands only for the one-shot SHA. Restore HOLD immediately and read back that it remains held.
- Confirm deployed Worker UUID, 100% staging traffic, D1 quick_check and applied migrations, Access destinations and native auth binding, production unchanged.
- Do not infer approval for production; no destructive multi-environment action.
- Link a release record with rollback Worker and explicit remaining QA. If failure, report/block or rollback according to approved and reversible plan.

## QA and media
Source: `docs/qa/IAICT_TEST_MANAGEMENT.md`, test CSV, test runs, defects.
Test labels: P0/P1/P2, READY/PLANNED case, PASS/FAIL/BLOCKED/NOT_RUN per run.
Mock UI and local unit tests do not prove authenticated Access/D1 staging flows.
Media private Drive IAM: https://drive.google.com/drive/folders/1Jq2bazYVZsyHlaU9Mr6jhaKlHj1MAjSp
PASS: https://drive.google.com/drive/folders/1W1HuaSxtaYMWxLDhdqy-U2HxX3jMlwfz
FAIL: https://drive.google.com/drive/folders/1g50_0CJI3uoCNH2aAT5dBlKbyBPtsFln
MANUAL: https://drive.google.com/drive/folders/1wW6te40YqBwc3dJNMT40cnVESC11Iv5j

## Mandatory changelog/handoff
`Goal | Issues/REQ/ADR | Changed code/Drive | Tests actual | Release SHA/Worker | D1/Access | Evidence | Risks | Next`.
If an agent lacks Drive or Cloudflare connection, provide steps/IDs, do not claim execution. No background work/promise when task is not scheduled by a real automation mechanism.
