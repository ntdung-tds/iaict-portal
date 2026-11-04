# PCS Moment — IAICT Portal

**PCS Universal 3.2.0 · Solo · Revision 65 checkpoint PR · B3.10 isolated Media scanner source MERGED · IAM PAUSED · production HOLD**

- **2026-11-04 11:12 ICT:** [PR #104](https://github.com/ntdung-tds/iaict-portal/pull/104) grouped source MERGED dev SHA `76bed3eecab94cf1c3f5bf4174d132291d5e96b4`. Isolated Pillow 13 full decoder, ClamAV zINSTREAM runner, cross-runtime HMAC receipt, forward-only 0026 private D1 evidence, original+derivative R2 SHA readback, revision CAS and private derivative cleanup. Existing 0025 migration unchanged.
- **Final reviewed head `4696ab9a`:** [Portal CI #41771159409](https://github.com/ntdung-tds/iaict-portal/actions/runs/41771159409) **4/4 PASS**, **724/724 Vitest**, **7/7 Pillow Python with FAKE AV socket**, **41/41 local Chromium** (CMS session mocked). [Real PUBLIC old-Worker #41771159404](https://github.com/ntdung-tds/iaict-portal/actions/runs/41771159404): 24/24 Chromium + 24/24 HTTP **PASS**; does not exercise new Media source.
- **Prior RED runs retained:** typecheck failure [#41770544134](https://github.com/ntdung-tds/iaict-portal/actions/runs/41770544134); Pillow WebP static/animation classification failure [#41770664892](https://github.com/ntdung-tds/iaict-portal/actions/runs/41770664892), both fixed and retested. OPS original intermittent 503 [#30](https://github.com/ntdung-tds/iaict-portal/issues/30) remains OPEN.
- **Exact postmerge SOURCE jobs:** [Portal #41771522866](https://github.com/ntdung-tds/iaict-portal/actions/runs/41771522866), [old-Worker staging #41771522878](https://github.com/ntdung-tds/iaict-portal/actions/runs/41771522878) **PENDING at first checkpoint**; verify later before claiming PASS.
- **Blocked external tasks:** real ClamAV isolated service, trusted R2 job runner, secret provision/recovery, hosted D1 0025/0026, true CMS Access/native role browser and CMS-MEDIA-001..012; no AV vendor signature test yet. `MEDIA_POLICY.scan.serviceConfigured=false`, quarantine Worker gate FALSE; no publication or public read. No staging/production deploy. IAM PAUSED, SRS FROZEN, owner production HOLD and final-source Drive handoff deferred until explicit bàn giao.
- **Next:** B3.11 real service and hosted acceptance gates or independent B4 work. Keep lightweight and track source-vs-hosted results separately.

**Continuity:** PCS rev65 is canonical only after documentation PR merge/readback. Older moment below retained.

---

## Historical PCS Moment (Revision 64)

**PCS Universal 3.2.0 · Solo · Revision 64 PROPOSED on documentation PR · B3.9 security source MERGED · IAM PAUSED · production HOLD**

- **2026-11-04 10:30 ICT:** [PR #102](https://github.com/ntdung-tds/iaict-portal/pull/102) source-only MERGED at `074b49dbe6d930dfd28c0c83c5506fff8a39d631`. D1/R2 binding now isolated by request; hourly/daily failed reservations and PURGE_PENDING storage bytes count against quotas. No Worker rollout or migration.
- **Exact PR-head:** `ed40a02f279c316101c0743ae77efcf84fe16bb2`, [Portal CI #41766771294](https://github.com/ntdung-tds/iaict-portal/actions/runs/41766771294) **4/4 PASS**, **713/713 Vitest**, **41/41 real local Chromium** (CMS identity mocked). [Public staging #41766771258](https://github.com/ntdung-tds/iaict-portal/actions/runs/41766771258) attempt 1 Chromium 24/24 PASS but HTTP sweep **FAIL 22/24, two 503**; attempt 2 24/24 Chromium and HTTP **PASS**. Both use old deployed Worker; original failures retained in [OPS #30](https://github.com/ntdung-tds/iaict-portal/issues/30).
- **Postmerge workflows:** [Portal #41767441954](https://github.com/ntdung-tds/iaict-portal/actions/runs/41767441954) and [old-Worker staging #41767441923](https://github.com/ntdung-tds/iaict-portal/actions/runs/41767441923) **PASS on exact merge SHA**: Portal CI 4/4 PASS, public acceptance PASS **against old deployed Worker only**; hosted Media E2E remains NOT_RUN.
- **Still BLOCKED:** scanner `serviceConfigured=false`, image decoder/re-encode + attestation, hosted D1 0025, real authorized CMS role browser and CMS-MEDIA-001..012 NOT_RUN. Upload gate FALSE, no public serving, 127 QA case definitions unchanged, no source Drive handoff. IAM PAUSED, SRS FROZEN, production HOLD; Cloudflare Preview mismatch [#32](https://github.com/ntdung-tds/iaict-portal/issues/32) unresolved.
- **Next:** B3.10 isolated AV scanner + trusted image decoder + attested CAS, then controlled staging release, rollback and authenticated E2E. Never infer hosted acceptance from local/source CI.

**Continuity:** Rev64 PROPOSED until docs PR merge and readback. Rev63 was merged in PR #101; historical observations follow.

---

## Historical PCS Moment (Revision 63)

**PCS Universal 3.2.0 · Solo · Revision 63 PROPOSED on documentation checkpoint PR · B3.8 private D1/R2 quarantine SOURCE MERGED · IAM PAUSED · production HOLD**

- **2026-11-04 09:48 ICT:** [PR #100](https://github.com/ntdung-tds/iaict-portal/pull/100) merged exact `ef3d095661342546b2ed8d144315e8ed807f6cee`; dev branch only, NO staging/production release. [B3.8 design](../docs/requirements/media-r2/MEDIA_R2_B3_8_QUARANTINE_PIPELINE_2026-11-04.md), [RUN-MEDIA-20261104-08 and 09](../docs/qa/IAICT_TEST_RUNS.md).
- **Exact source gates:** final PR head `b94b04e5`: [Portal CI #41752365334](https://github.com/ntdung-tds/iaict-portal/actions/runs/41752365334) **4/4 PASS**, [public old-Worker #41752365211](https://github.com/ntdung-tds/iaict-portal/actions/runs/41752365211) **PASS**. Exact postmerge `ef3d0956`: [Portal CI #41762720634](https://github.com/ntdung-tds/iaict-portal/actions/runs/41762720634) **4/4 PASS**, [public old-Worker #41762720839](https://github.com/ntdung-tds/iaict-portal/actions/runs/41762720839) **PASS**; hosted Media E2E **NOT_RUN**.
- **Implemented in source ONLY:** forward-only D1 0025 ledger, bounded same-Origin native/CMS-role upload, private R2 object, quotas/idempotency, CAS janitor and local Miniflare D1+R2/8 synthetic-role security tests. Local CMS compression UI from PR98 already merged, NOT DEPLOYED. Cloudflare Worker binding `MEDIA_R2_QUARANTINE_ENABLED=false`; no authorized public read/publish route or scan.
- **Still BLOCKED:** scanner `serviceConfigured=false`, trusted image decoder/derivative attestation absent; hosted migration, R2 writes, true Access login and `CMS-MEDIA-001..012` NOT_RUN. 127 canonical QA cases and Drive Master v2.15 unchanged; no source handoff, SRS FROZEN, IAM PAUSED, production HOLD.
- **Independent Cloudflare readback:** staging deployment `754b0509-e754-410c-8dff-46015d162a89` and production `a01a3743-ac78-4a19-a990-581fe9235751` unchanged. Cloudflare Preview build configuration fails using `wrangler preview` with cf output; existing [Issue #32](https://github.com/ntdung-tds/iaict-portal/issues/32). Operations transient 503 [#30](https://github.com/ntdung-tds/iaict-portal/issues/30) OPEN.
- **Next:** complete B3.9 scanner/decode and approved deployment gates or advance independent B4 training/contact/CRM work; do not conflate source acceptance with hosted release.

**Continuity:** Rev63 stays PROPOSED until checkpoint PR merges and readback; rev62 from PR #99 remains canonical until then. Earlier observations preserved below.

---

## Historical PCS Moment (Revision 62)

**PCS Universal 3.2.0 · Solo · Revision 62 PROPOSED on postmerge checkpoint PR · B3.7 compression LOCAL SOURCE MERGED and REAL Chromium PASS · IAM PAUSED**

- **Canonical prior:** rev61 on development SHA `f91c0b4fe20139d6fa2ffb45324f13ff0dea23c6` from merged [PR #98](https://github.com/ntdung-tds/iaict-portal/pull/98). Owner requested grouping and completing image/file compression. Local browser image encoder, ZIP32 CRC32 DEFLATE/STORE, gzip and CMS responsive UI are implemented and committed. [ADR-MEDIA-20261104-02-COMPRESSION](../docs/adr/ADR-MEDIA-20261104-02-COMPRESSION.md), `CHG-MEDIA-R2-20261104-04` logged; SRS baseline unchanged.
- **Verified source + REAL local browser:** [RUN-MEDIA-20261104-06](../docs/qa/IAICT_TEST_RUNS.md) preserves unit and browser RED history; source **696/696 Vitest PASS** (67 files) and final local Chromium **41/41 PASS**, including real PNG download, ZIP download, gzip roundtrip, 320px mobile. Local test **MOCKS CMS session only**. It is NOT an authenticated hosted browser acceptance.
- **Final PR #98 HEAD:** `53d5fbbe5ecfafe0c21024377312fa64043a2e91`; [Portal CI #41744861762](https://github.com/ntdung-tds/iaict-portal/actions/runs/41744861762) **4/4 PASS**, [public staging #41744861538](https://github.com/ntdung-tds/iaict-portal/actions/runs/41744861538) **PASS old deployed Worker**.
- **Exact merge SHA `f91c0b4fe20139d6fa2ffb45324f13ff0dea23c6`:** [Portal CI #41745293756](https://github.com/ntdung-tds/iaict-portal/actions/runs/41745293756) **4/4 PASS**, [public staging #41745293772](https://github.com/ntdung-tds/iaict-portal/actions/runs/41745293772) **PASS old Worker**. [RUN-MEDIA-20261104-07](../docs/qa/IAICT_TEST_RUNS.md) records exact evidence. No Worker was deployed.
- **What is completed:** local on-device CMS tool source/UI with real compressed output and downloads, ZIP from user-selected local files. **What is NOT completed:** hosted upload, AV scanner, trusted server-side decoder, D1/R2 asset lifecycle, ZIP from private CMS/R2 assets, actual authenticated Access browser. `CMS-MEDIA-001..012` hosted NOT_RUN, 127 canonical QA definitions unchanged, Google Master v2.15 unchanged. Scanner `MEDIA_POLICY.scan.serviceConfigured=false` still denies review/publish/serve.
- **Operational boundary:** IAM owner-PAUSED, SRS FROZEN, production HOLD. Cloudflare staging Worker deployment `754b0509-e754-410c-8dff-46015d162a89`, production `a01a3743-ac78-4a19-a990-581fe9235751` confirmed unchanged before merge. [OPS Issue #30](https://github.com/ntdung-tds/iaict-portal/issues/30) OPEN. No source Drive handover absent explicit “bàn giao”.
- **Next:** actual Media B3.8 scanner/decoder, D1+private R2 secure staging pipeline, genuine CMS role E2E and release gates; production still on HOLD.

**Continuity:** Rev62 is proposed until this docs-only checkpoint merges and dev branch readback confirms it. Previous rev61 remains canonical until then.
