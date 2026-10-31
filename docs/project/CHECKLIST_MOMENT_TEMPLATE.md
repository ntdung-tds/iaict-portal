# PROJECT — CHECKLIST MOMENT (TEMPLATE / copy for every project)
**Moment ID:** `MOMENT-<PROJECT>-YYYYMMDD-HHmm-TZ` · **Captured:** `YYYY-MM-DDTHH:mm:ss+07:00` · **Project + workstream:** [fill].
**Main plan:** `PROJECT_PLAN.md` · **Progress log:** `PROJECT_PROGRESS.md` · **Checklist live:** `CHECKLIST_MOMENT.md` · **Immutable snapshots:** `checklist-moments/YYYY-MM-DDTHH-mm-TZ.md`.
**Observed baseline:** repository/branch/PR, immutable SHA, deployment/version, migration, source evidence, review date, which environment. **Owner approvals:** explicit | PENDING.

## Mandatory statuses
- `[x] DONE`: explicit bounded DoD & evidence URL; distinguish technical vs live acceptance.
- `[ ] IN_PROGRESS`: last verified substep, **current exact checkpoint**, remaining substeps, next concrete action.
- `[ ] BLOCKED`: blocker reason, dependency/owner, condition to unblock, safe alternative.
- `[ ] NOT_STARTED`: no scoped implementation/verification.
- `[ ] DEFERRED`: only resume on explicit owner trigger; do not auto-run.
- Counts include **DONE only**, denominator fixed to explicitly listed scope; never invent overall project completion.

## Workstream <NAME>: X/Y DONE
| Stable task ID | Check | State | Scope / completed substep | Exact next substep + blocker | Evidence (SHA/issue/test/run/Drive) |
|---|---|---|---|---|---|
| MOD-01 | [x] | DONE | Defined bounded result | None; later acceptance separate ID | [verified link] |
| MOD-02 | [ ] | IN_PROGRESS | S1 verified | **S2 currently in progress:** ... | [verified link] |
| MOD-03 | [ ] | BLOCKED | S1 verified | Need identity / approval / env | [verified link] |
| MOD-04 | [ ] | NOT_STARTED | No implementation | Start requirements / threat model | [verified link or NONE] |

## Test/release status
| Test ID | Layer & environment | Expected | Observed | PASS/FAIL/BLOCKED/NOT_RUN | QA evidence |
|---|---|---|---|---|---|
| [case] | CI unit/mock or live authentic | ... | ... | ... | [exact URL / NOT_CAPTURED] |

## Last known handoff
- Previous moment ID + timestamp:
- Last completed safe action (immutable proof):
- In-progress task **ID & step number**:
- Next atomic action:
- Open failures and blockers / owners:
- Risks / decisions / pending approval:
- Runtime state / rollback:
- What was **not done or not tested**:
- "chốt SRS", production, Access change, final Drive handoff: do not infer permission from routine acknowledgments.

## Snapshot method (for all projects)
At start and end of every work batch or chat handoff, or whenever status changes: read previous moment → verify repo/runtime → update plan/progress if needed → **write NEW time-stamped snapshot, never edit old** → update LIVE pointer → check CI/readback → link to new moment. GitHub Issues/PRs remain authoritative task records; Drive is a human-readable snapshot and evidence home, not an independent duplicated backlog.
