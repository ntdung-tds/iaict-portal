# IAICT Portal — PROJECT PLAN (WORKING / NOT OWNER-APPROVED)
**Plan ID:** `PLAN-IAICT-20261031-01` · **Date:** 2026-10-31T19:46:47+07:00 · **Baseline for planning:** source HEAD `a6afff7e`; [Checklist Moment](CHECKLIST_MOMENT.md) is the live execution pointer. **Scope proposals in uploaded IAM v1.2 are not approved SRS.**

## Goal and order
Safely complete IAICT-developed CMS/IAM foundations on staging, prove real-role authorization, then extend R2 media and CRM permission scopes. Keep production and Access untouched absent explicit approvals. No fabricated deadlines; dependencies govern sequence.

| Phase | Scope | Priority / dependencies | Definition of Done / evidence | Current |
|---|---|---|---|---|
| P0-A | Preserve current secure staging release, rollback, QA docs and requirement logs | NOW; read-only first | exact Worker SHA/version, CI, 24 migrations/quick_check, Access, QA run, private evidence URLs | Foundation documented; current release not final IAM |
| P0-B | KDF compatibility and Auth architecture ADR | before modifying password hash design | controlled 100k/100001/600k worker test with synthetic inputs; measured results; reviewed migration-compatible ADR | NOT_STARTED (report hypothesis only) |
| P0-C | MFA enrollment/challenge/replay/recovery, Admin step-up | after P0-B/ADR | encrypted secret, atomic replay guard, recovery controls, threat model, negative tests, real E2E | IN_PROGRESS (primitive only) |
| P0-D | Fine-grained permissions and resource/tenant/CRM scopes | design independently; before Access cutover | shared policy at API/DB, no IDOR/privilege escalation, revoke immediacy, role × action × scope × state tests | NOT_STARTED |
| P0-E | Genuine 7-role staging QA and 2-admin race test | verified IAICT QA mailboxes+Access+password vault; no counterfeit | live authorized Chromium role matrix, 409 races, actual QA runs/Drive evidence | BLOCKED [#34](https://github.com/ntdung-tds/iaict-portal/issues/34) |
| P0-F | Trusted email verification/invite, forgot password, security audit, break-glass, privacy/backup controls | independent P0 gates before cutover | email delivery verification, secure recovery, approved runbooks/DSAR, backup restore | PARTIAL/NOT_STARTED |
| CMS-MEDIA | Secure CMS media in R2 staging | after threat model/permission contract | upload + MIME/magic-byte + malware policy + auth/ownership + cleanup/negative QA | NOT_STARTED [#39](https://github.com/ntdung-tds/iaict-portal/issues/39) |
| P1 | IAM groups/org, session console, access review, user CSV, CRM workflows | after core security/permissions | functional+security tests with owner acceptance | NOT_STARTED |
| P2 | SSO/SCIM/multi-tenant scaled features | needs approved business need | ADR+integration tests | DEFERRED |
| RELEASE | Production & Cloudflare Access cutover | **separate owner approval + P0 security gate** | staging real E2E / rollback / signed decision, production preflight | DEFERRED |
| HANDOFF | Final source Drive archive | **only exact “bàn giao”** | pinned full archive, checksum, clean restore, signoff | DEFERRED [#38](https://github.com/ntdung-tds/iaict-portal/issues/38) |

## Planning rules
1. Real work moves through GitHub Issue/PR (source of truth); this plan is priority/dependency projection, not duplicate task authority.
2. Every batch: explicit scope, affected `thaydoi.md`, impacted QA case IDs/Drive, risks, rollback and SHA.
3. `CHECKLIST_MOMENT.md` tracks last substep and pause/resume; `PROJECT_PROGRESS.md` records delivered/blocked evidence and current checkpoint. Both updated with each significant state change.
4. Uploaded `IAICT_IAM_v1_2_FRESH_DOWNLOAD.docx` provides 20 IAM proposals, KDF hard-cap risks and KDF-01–06 / IAM-T33–43 proposed tests. They must be reviewed, mapped and approved separately; not all are implementation requirements.
5. No scheduled completion date or % total project done asserted without defined scope and owner acceptance.
