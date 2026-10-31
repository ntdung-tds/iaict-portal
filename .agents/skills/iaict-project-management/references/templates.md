# Project record templates — IAICT

## Task / change request
```yaml
id: TASK-IAM-001  # or linked GitHub issue number
requirement: REQ-IAM-001
title: ""
owner_role: UNASSIGNED
priority: P0
status: TRIAGED  # READY/IN_PROGRESS/REVIEW/QA/BLOCKED/DONE
scope: ""
out_of_scope: ""
acceptance_criteria: []
dependencies: []
risk_ids: []
test_case_ids: []
github_issue_url: ""
pr_url: ""
commit_sha: ""
drive_doc_url: ""
notes: ""
```

## Risk entry
```yaml
id: RISK-001
event: "If [cause], then [event], resulting in [impact]"
likelihood_1_to_5: null
impact_1_to_5: null
score: null
owner_role: UNASSIGNED
mitigation: ""
contingency: ""
trigger: ""
status: OPEN
review_due: ""
```

## Architecture decision (ADR-NNNN)
```md
# ADR-NNNN — Decision name
Status: PROPOSED / ACCEPTED / REJECTED / SUPERSEDED
Date: YYYY-MM-DD | Owner/approver: UNASSIGNED
Context/problem:
Decision drivers:
Options considered (security/cost/effort):
Decision and rationale:
Consequences / tradeoffs:
Rollback / migration implications:
Linked REQs, issues, PR, test cases:
Approval evidence link:
```

## Release and test handoff
```yaml
release_id: REL-YYYYMMDD-NN
environment: staging
approved_by: UNASSIGNED
approval_link: ""
source_pr_url: ""
immutable_sha: ""
worker_previous: ""
worker_deployed: ""
d1_migration_count: null
d1_bookmark_verified: false
access_paths_verified: false
cloudflare_hold_restored: false
ci_run_urls: []
case_ids: []
test_run_id: ""
test_actual_summary: ""
defect_ids: []
drive_evidence_urls: []
production_changed: false
rollback_plan: ""
known_blockers: []
```

## Defect record
See `docs/qa/IAICT_DEFECT_TEMPLATE.md`. Include CASE, RUN, BUG and sanitized Drive FAIL link. For screenshot not taken, put NOT_CAPTURED, not invented URL.

## Agent handoff
```md
IAICT | YYYY-MM-DD
Changed:
Exact PR SHA:
Verified tests:
Staging Worker + production status:
Drive links (verified):
Not tested / BLOCKED:
RISK / ADR / owner approval pending:
Next safe batch:
```
