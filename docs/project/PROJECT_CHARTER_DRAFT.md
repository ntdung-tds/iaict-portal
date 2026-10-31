# PRJ-CHTR-001 — IAICT Portal Project Charter (DRAFT v0.1)
**Date:** 2026-10-31 · **Status:** DRAFT — NOT APPROVED · **Sponsor:** IAICT, named approver TBD

## Purpose / business value
IAICT independently engineers and operates a trustworthy digital portal: public site, CMS/newsroom, account management, future CRM extensions and reusable integration foundation. Preserve content continuity, security, operability and ownership of platform architecture.

## Outcomes (proposed, to validate with sponsor)
1. Usable responsive IAICT public portal and administrable CMS/news workflow with tested release process.
2. Reliable IAM foundation: secure native auth, MFA and recovery once reviewed, least-privilege permission and lifecycle controls; Cloudflare Access retained as defense until independent acceptance.
3. Transparent governance: versioned backlog and decisions, traceable 73-case QA baseline, private Drive evidence, safe staging/production separation.
4. Extensible CRM module with contact/account separation and audited ownership, only after explicit requirements and scope.

## Constraints and boundaries
- Cloudflare Workers, D1, R2 and Cloudflare Access currently deployed; architectural changes require an ADR.
- Staging is the implementation and test environment; production changes require explicit human release authorization.
- GitHub is the single source of truth for software and tests; the verified master Drive stores governance/approved docs/media.
- Data protection: no real login/test secrets or public QA screenshots, no unapproved data migration/deletion.
- Budget, named roles, deliverable deadlines, legal sign-off and service-level objectives have **not been confirmed**: these are open decisions, not promises.

## Deliverables & acceptance gates
- **D0 Governance:** Master folder, navigation, instruction skill, PM model, risk and decision registers — draft reviewed.
- **D1 IAM P0:** authenticators/MFA, recovery, permission scopes, session security and no unapproved Access removal; test and security gates.
- **D2 CMS/News:** regression on public publishing, admin workflows, preview, audit.
- **D3 CRM:** data/permission design, UX, and phased implementation after scope approval.
- **D4 Release readiness:** staged CI, D1/Access/R2 check, rollback drill, QA evidence, explicit owner acceptance prior to production.

## Roles / approval matrix
Sponsor/owner: IAICT authorized representative (named approval pending).
Product/requirements: named role pending.
Engineering/dev agent: execution, tests, versioned records.
QA/security reviewer: independently checks verdicts and risk closure (named reviewer pending).
Agent cannot approve for sponsor or claim independent security audit.

## Risks / assumptions / open items
- IAM without complete MFA and recovery is not eligible for native-auth-only admin rollout.
- Test suite PASS does not establish live authenticated acceptance; test cases and QA runs must remain distinct.
- My Drive master currently has private ownership; future organization Shared Drive migration requires license, ACL design and approval.
- No blanket retention or deletion policy set.
- See `docs/project/RISK_REGISTER.md` for risk owner TBD entries.

## Approval
- Proposed by: AI working draft on behalf of IAICT project (not signed).
- Sponsor decision: PENDING.
- Date/signature or approval link: NOT PROVIDED.
- Change request / version history: preserve future approvals and superseded records.
