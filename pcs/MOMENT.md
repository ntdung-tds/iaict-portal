# PCS Moment — IAICT Portal

**PCS Universal 3.2.0 · Solo · Revision 71 · B3.15 AUTHENTICATED MEDIA QA HARNESS SOURCE MERGED · portal CI + public staging PASS · REAL AUTHENTICATED UPLOAD NOT_RUN · Private staging quarantine ON · ClamAV hosted BLOCKED · IAM PAUSED · SRS FROZEN · production HOLD**

**2026-11-05 19:19 ICT:** [PR #115](https://github.com/ntdung-tds/iaict-portal/pull/115) merged test+docs source to active development branch, SHA adc227e68fdedec570c1716ef7ffd15e723b8703. Reviewed exact PR-head ccb14bd56aa6046804ea23484453e5684f12774b: [Portal CI #42025533744](https://github.com/ntdung-tds/iaict-portal/actions/runs/42025533744) **4/4 PASS** and [live PUBLIC staging acceptance #42025533817](https://github.com/ntdung-tds/iaict-portal/actions/runs/42025533817) **PASS** on unchanged deployed staging Worker. This was code/test safety verification, **NOT** an authorized Media upload run.

- **New grouped deliverables:** manual-only, isolated Playwright staging session runner (reject CI and cookie files inside Git/repo; chmod 600; no screenshots/video/traces/retries), real Admin/Editor/Viewer staged upload/role/CSRF/MIME/replay/optional size subtests with synthetic 1×1 PNG; independent D1/R2 byte-SHA validation checklist. Case labels map to existing CMS-MEDIA-001/002/003/004/008/012 as **PARTIAL**, without automatic full-case PASS. No API, UI production runtime, Cloudflare Access, D1 or R2 mutation was made by this source PR. [QA runbook](../docs/qa/IAICT_MEDIA_B315_HOSTED_QA.md) · [RUN-MEDIA-20261105-01](../docs/qa/IAICT_TEST_RUNS.md) · [CHG-MEDIA-R2-20261105-01](../docs/requirements/media-r2/thaydoi.md).
- **Independently verified live state, read-only 05/11:** staging deployment c43e105c-f978-426f-b42c-f515238c2252 / Worker 4ab3ecef-9ebd-485e-afb0-eac55136751d **unchanged**; live D1 media_r2_quarantine_uploads still **0 rows**; production deployment a01a3743-ac78-4a19-a990-581fe9235751 unchanged. Staging private quarantine gate ON, actual source media still no public URL.
- **LIVE NOT_RUN / BLOCKED:** no legitimate Admin/Editor/Viewer Cloudflare Access + CMS QA session/storageState or retrievable credential-vault integration. Eight synthetic D1 fixtures remain disabled; never impersonate Access or store cookies in CI/Drive/Git. Actual HTTP 201 signed-in upload, remote R2 bytes/SHA and viewer/CSRF/size/idempotency hosted QA **NOT_RUN**. ClamAV hosted scanner/publication still **BLOCKED** (Workers Paid Containers or approved equivalent), all files private quarantine only.
- **Control:** IAM feature implementation **PAUSED** (limited approved Media QA setup is distinct), SRS **FROZEN**, production **HOLD**, project handover deferred until explicit owner instruction. [Issue #39](https://github.com/ntdung-tds/iaict-portal/issues/39) remains OPEN. **Next:** obtain secure authorized QA identity/session and run real B3.15 with D1/R2 byte readback + Drive evidence, or continue separate scanner-host feasibility without claiming Media complete.

**Continuity:** PCS rev71 is canonical only after this documentation checkpoint PR is merged/read back. Older rev70 moment follows.

---

## Historical PCS Moment (Revision 70)

**PCS Universal 3.2.0 · Solo · Revision 70 · B3.14 Live anonymous Media Access edge PASS · Private staging upload gate ON · Authenticated upload E2E NOT_RUN · ClamAV hosted BLOCKED · IAM PAUSED · production HOLD**

**2026-11-04 21:36 ICT:** [PR #113](https://github.com/ntdung-tds/iaict-portal/pull/113) merged B3.14 hosted ANONYMOUS Media access tests at dev merge `34ee2bc5c9fac6704e0747d432d540a0f6247e31`. [Final source Portal CI #41848546547](https://github.com/ntdung-tds/iaict-portal/actions/runs/41848546547) **4/4 PASS**, [real staging browser #41848546687](https://github.com/ntdung-tds/iaict-portal/actions/runs/41848546687) **28/28 Chromium PASS** (24 previous + **4 new Media access negatives**), **24/24 repeated HTTP PASS**, zero 503/5xx; explicit private Media GET/POST and forged identity denial at Cloudflare Access. QA catalog now **130 total cases**, new `CMS-MEDIA-016..018` strictly anonymous, not authenticated role tests. Initial RED source [#41847513261](https://github.com/ntdung-tds/iaict-portal/actions/runs/41847513261) TS malformed regex and [#41847513210](https://github.com/ntdung-tds/iaict-portal/actions/runs/41847513210) Playwright parse failure preserved; fixed at `24fea7f` and rerun.

- **ACTUAL hosted state:** Cloudflare staging Worker deployment `c43e105c-f978-426f-b42c-f515238c2252`, version `4ab3ecef-9ebd-485e-afb0-eac55136751d` **unchanged**, private Media quarantine gate stays ON, D1 `media_r2_quarantine_uploads` still **0 rows** after anonymous tests. Production deployment `a01a3743-ac78-4a19-a990-581fe9235751` unchanged. No new deployment or migration.
- **NOT_RUN:** authenticated Admin/Editor CMS upload `201 QUARANTINED`, independent private hosted R2 bytes/SHA, viewer denial, authenticated CSRF, MIME/size, idempotency full CMS-MEDIA-001..012 E2E. A pass for anonymous edge protection is not proof of successful authorized upload. No controlled QA identity/session available; do not forge.
- **BLOCKED:** isolated hosted ClamAV scanner requires Workers Paid Containers or other approved host; source images remain private only, public media serving OFF. IAM PAUSED, SRS FROZEN, production HOLD. QA [RUN-MEDIA-20261104-28](../qa/IAICT_TEST_RUNS.md) and rev70 appended RUN-29; [Issue #39](https://github.com/ntdung-tds/iaict-portal/issues/39) OPEN. **Next B3.15** genuinely authenticated staging browser POST/R2-D1 SHA proof when QA identity available.

**Continuity:** rev70 canonical only after docs PR merge/readback. Prior historical PCS moments retained below.

---

## Historical PCS Moment (Revision 69)

**PCS Universal 3.2.0 · Solo · Revision 69 · B3.13 PRIVATE STAGING QUARANTINE UPLOAD GATE ON · Hosted upload E2E NOT_RUN · Scanner BLOCKED · IAM PAUSED · production HOLD**

**2026-11-04 19:12 ICT:** [manual deploy-staging #41815504208](https://github.com/ntdung-tds/iaict-portal/actions/runs/41815504208), attempt **4 SUCCESS** after earlier RED failures (missing GitHub secrets; then Cloudflare Access app token HTTP403, both fixed by owner). Release branch `release/staging-media-quarantine-20261104` at reviewed SHA `1ed8038c4886c8218b4f9d94c8d94dac9f7f7e81`. **Cloudflare actual staging Worker** deployment `c43e105c-f978-426f-b42c-f515238c2252`, version `4ab3ecef-9ebd-485e-afb0-eac55136751d`, **100%**, verified private R2 binding `iaict-portal-staging-media`, D1 `aa4a97e7-60c5-4da4-9f0b-d469ece811b4`, `MEDIA_R2_QUARANTINE_ENABLED=true`. GitHub workflow preflight Access routes/AUD, D1 26 migrations, 3 active admins, version rollback, build/deploy/readback/health and **24/24 PUBLIC Chromium PASS**, 724/724 standard unit +5 dedicated tests skipped without fixture. **Production Worker unchanged** `a01a3743-ac78-4a19-a990-581fe9235751`.

- **Important incomplete validation:** live D1 `media_r2_quarantine_uploads` **0 rows**, `media_r2_scan_evidence` **0 rows** when checked. No authenticated admin/editor POST with private hosted R2 source SHA readback has been executed. REAL hosted CMS-MEDIA-001..012 and role/CSRF/negative browser **NOT_RUN**, not PASS. The feature is *deployed/gate ON*, but usage is not yet independently E2E accepted.
- **Policy:** raw files are **private `QUARANTINED` and require scanning**, no public image serving. Cloudflare Containers scanner still **BLOCKED (Workers Paid plan required)**. No privileged test identity invented or bypassed. IAM PAUSED, SRS FROZEN, production HOLD, OPS #30 historical 503 issue OPEN.
- **Next:** B3.14 controlled browser-admin/editor upload and D1/R2 byte evidence + negative roles; then separate hosted isolated ClamAV runtime and signed derivative/publication testing. Evidence [RUN-MEDIA-20261104-26](docs/qa/IAICT_TEST_RUNS.md); [issue #39](https://github.com/ntdung-tds/iaict-portal/issues/39).

**Continuity:** rev69 canonical only after docs PR merge/readback; rev68 history retained below.

---

## Historical PCS Moment (Revision 68)

**PCS Universal 3.2.0 · Solo · Revision 68 checkpoint · B3.13 staging QUARANTINE UPLOAD RELEASE READY, NOT DEPLOYED · Scanner hosted BLOCKED · IAM PAUSED · production HOLD**

- **2026-11-04 14:40 ICT:** [PR #110](https://github.com/ntdung-tds/iaict-portal/pull/110) merged source `1ed8038c4886c8218b4f9d94c8d94dac9f7f7e81`. New responsive CMS `/admin/media/upload` for admin/editor only; private POST `QUARANTINED`/requiresScan/null public URL, authenticated GET readiness, quota/idempotent retry, 10 MiB preflight, 7-day private cleanup. Production quarantine gate hard OFF; scanner/public serving still OFF. No publication of raw bytes.
- **Source QA:** [Portal CI #41792842622](https://github.com/ntdung-tds/iaict-portal/actions/runs/41792842622) **4/4 PASS**, **724/724 unit** (+5 dedicated genuine AV cases skipped without fixture), **46/46 local Chromium** (5 new MOCK CMS upload browser tests); [PUBLIC old staging Worker #41792842621](https://github.com/ntdung-tds/iaict-portal/actions/runs/41792842621) **24/24 Chromium +24/24 repeated HTTP PASS**. Exact source postmerge [Portal #41793305764](https://github.com/ntdung-tds/iaict-portal/actions/runs/41793305764) 4/4 PASS, [real ClamAV CI #41793306193](https://github.com/ntdung-tds/iaict-portal/actions/runs/41793306193) PASS, [public OLD Worker #41793305878](https://github.com/ntdung-tds/iaict-portal/actions/runs/41793305878) 24/24 Chromium+24/24 HTTP PASS.
- **RED preserved:** [CI #41791860597](https://github.com/ntdung-tds/iaict-portal/actions/runs/41791860597) strict TypeScript discriminated union failure, fixed, rerun source PASS. Additional 5 UI tests initially absent from Chromium selection; added mandatory and proved 46/46 PASS. Original staging intermittent HTTP 503 [issue #30](https://github.com/ntdung-tds/iaict-portal/issues/30) still OPEN.
- **ACTUAL staging preflight (READ-ONLY):** Cloudflare D1 **26 migrations** including 0025/0026, **3 active admins** (identities not accessed), protected Access roots/wildcards and audience, R2 `iaict-portal-staging-media`, retrievable Worker version `1b8cfe71-88ef-4e21-8937-4f8590daaba4` and Time Travel bookmark available. **Release branch created** `release/staging-media-quarantine-20261104` exactly at source merge SHA; this alone does **NOT** deploy Worker. Current staging Worker deployment `754b0509-e754-410c-8dff-46015d162a89`, production `a01a3743-ac78-4a19-a990-581fe9235751` unchanged.
- **Manual release required:** GitHub Actions [deploy-staging](https://github.com/ntdung-tds/iaict-portal/actions/workflows/deploy-staging.yml), branch `release/staging-media-quarantine-20261104`, input approved SHA `1ed8038c4886c8218b4f9d94c8d94dac9f7f7e81`, expected Worker version `1b8cfe71-88ef-4e21-8937-4f8590daaba4` *only if still live*. GitHub connector has no workflow_dispatch action; staging environment secrets unverified. No hidden deployment. After manual release, require actual admin/editor GET readiness and POST R2/D1 byte readback and viewer/CSRF/oversize negatives before hosted acceptance.
- **Full Media BLOCKED:** Cloudflare Containers API HTTP401 explicitly states **Workers Paid plan required**, no real hosted scanner. `MEDIA_POLICY.scan.serviceConfigured=false`, no approved derivative, no public image serving, IAM owner-PAUSED, SRS FROZEN, production HOLD. No QA images or credentials in GitHub.

**Next:** trigger approved manual staging-only private quarantine deployment; run genuine hosted CMS upload E2E; separately provision Workers Paid/isolated scanner before publication.

**Continuity:** rev68 becomes canonical only after docs PR merge/readback; historical Moment below retained.

---

## Historical PCS Moment (Revision 67)

**PCS Universal 3.2.0 · Solo · Revision 67 checkpoint PR · B3.12 real ClamAV→private D1/R2 integration SOURCE MERGED · HOSTED Scanner BLOCKED · IAM PAUSED · production HOLD**

- **2026-11-04 12:50 ICT:** [PR #108](https://github.com/ntdung-tds/iaict-portal/pull/108) B3.12 source-only MERGED to dev at `b24682db20573fef2b8e5c46b75b31874cbdece2`. Real ClamAV Docker EICAR+clean double-scan → Pillow source/derivative bytes → **independent Python-signed HMAC** → TypeScript verifier → actual disposable Miniflare private R2 original+derivative SHA readback → D1 CAS/audit → replay protection → purge both objects.
- **Exact reviewed source head `a114fdd4a1bb9019da13a8bdc1791902d14a8432`:** [real AV #41781000006](https://github.com/ntdung-tds/iaict-portal/actions/runs/41781000006) **3/3 genuine ClamAV Python + 5/5 Miniflare D1/R2 integration PASS** on same harmless synthetic fixture. [Portal #41781000026](https://github.com/ntdung-tds/iaict-portal/actions/runs/41781000026) **4/4 PASS**, **724/724 standard unit PASS + 5 dedicated tests SKIPPED without real AV fixture**, 7/7 Python mock AV, 41/41 local Chromium. [Public OLD Worker #41781000014](https://github.com/ntdung-tds/iaict-portal/actions/runs/41781000014) **24/24 real Chromium + 24/24 repeated HTTP PASS**; does NOT test hosted Media.
- **Preserved RED→fix:** [original #41780387128](https://github.com/ntdung-tds/iaict-portal/actions/runs/41780387128) **FAIL** because Vitest file under `services/` excluded from discovery; moved to `lib/media-r2-real-av-bridge.test.ts` and retested [#41780626240](https://github.com/ntdung-tds/iaict-portal/actions/runs/41780626240) **3/3 real AV + 5/5 bridge PASS**, then rechecked final source head. OPS staging #30 intermittent 503 historical FAIL still OPEN.
- **Exact source postmerge jobs:** [Portal #41781401748](https://github.com/ntdung-tds/iaict-portal/actions/runs/41781401748), [real AV #41781401775](https://github.com/ntdung-tds/iaict-portal/actions/runs/41781401775), [public OLD Worker #41781401796](https://github.com/ntdung-tds/iaict-portal/actions/runs/41781401796): **PASS exact merge SHA after checkpoint**: Portal 4/4, real AV 3/3 +5/5 bridge, OLD Worker 24/24 Chromium and 24/24 HTTP, 0 new 503; **NOT hosted Media**.
- **Still BLOCKED:** Cloudflare Containers applications API returns **HTTP 401**; real ClamAV not deployed on staging; no remote R2 private runner/HMAC service secret, no real CMS role browser E2E CMS-MEDIA-001..012. Only staging D1 0025/0026 applied in B3.11; no new Worker deployment, `MEDIA_POLICY.scan.serviceConfigured=false` and `MEDIA_R2_QUARANTINE_ENABLED=false`. IAM PAUSED, SRS FROZEN, production HOLD. No source or sensitive media uploaded to GitHub.
- **Next:** B3.13 provision authorized isolated ClamAV host/secret, connect live R2/D1 private service and verify hosted EICAR + authorized role E2E before releasing staging gate. Do not label Media ready from CI alone.

**Continuity:** rev67 becomes canonical only after docs PR merge/readback; previous Moment below retained.

---

## Historical PCS Moment (Revision 66)

**PCS Universal 3.2.0 · Solo · Revision 66 checkpoint · B3.11 STAGING D1 0025/0026 APPLIED · REAL ClamAV CI PASS · Hosted Scanner BLOCKED · IAM PAUSED · production HOLD**

- **2026-11-04 11:55 ICT:** [PR #106](https://github.com/ntdung-tds/iaict-portal/pull/106) grouped B3.11 source MERGED to development at `c6c5d3e4a0ada4d170c652334b75e8fb15c73cec`.
- **Actual STAGING D1:** migrations `0025_media_r2_quarantine.sql` and `0026_media_r2_scan_evidence.sql` applied from reviewed immutable blobs (0025 `c8320af6`, 0026 `9688defd`). Readback verified two new tables, four indexes, both migration ledger entries, zero media rows and zero foreign-key check rows. Cloudflare D1 Time Travel **before** `0000088c-00000000-00005119-76aa9aed51901ec93f3e3c545bc7b1fd`. This is retention-bound PITR, **not a separate durable SQL export**. `PRAGMA integrity_check` returned `SQLITE_AUTH` => UNSUPPORTED/NOT_RUN.
- **REAL antivirus engine acceptance:** [CI #41775549025](https://github.com/ntdung-tds/iaict-portal/actions/runs/41775549025) PASS **3/3 real ClamAV** tests including harmless EICAR FOUND, clean PNG/WebP dual scan/receipt and SHA reject (ClamAV official Docker, isolated GitHub runner, no real customer data); source [Portal #41775549028](https://github.com/ntdung-tds/iaict-portal/actions/runs/41775549028) **4/4 PASS**, **724/724 unit**, 7/7 Pillow/mock AV, **41/41 local Chromium**; [public OLD staging Worker #41775549127](https://github.com/ntdung-tds/iaict-portal/actions/runs/41775549127) **24/24 Chromium+24/24 HTTP PASS**, not new Media backend.
- **Source postmerge:** [Portal #41775911286](https://github.com/ntdung-tds/iaict-portal/actions/runs/41775911286) **4/4 PASS**, [real ClamAV #41775911322](https://github.com/ntdung-tds/iaict-portal/actions/runs/41775911322) **PASS**, [old-Worker public #41775911292](https://github.com/ntdung-tds/iaict-portal/actions/runs/41775911292) **PASS exact merged source SHA** (public 24/24 Chromium and 24/24 HTTP, zero new 503; OLD Worker, not Media E2E).
- **HOSTED BLOCKED:** Cloudflare Containers applications GET returned **HTTP 401**, so no scanner container deployed or real HMAC service identity, private R2 job runner or authorized CMS Media E2E. `MEDIA_POLICY.scan.serviceConfigured=false` and `MEDIA_R2_QUARANTINE_ENABLED=false`; staging Worker remains deployment `754b0509-e754-410c-8dff-46015d162a89`, production Worker `a01a3743-ac78-4a19-a990-581fe9235751` unchanged. No R2 object writes, no source screenshots or Drive handoff. IAM PAUSED, SRS FROZEN, production HOLD.
- **Issues:** [Media #39](https://github.com/ntdung-tds/iaict-portal/issues/39) OPEN, staging intermittent 503 [#30](https://github.com/ntdung-tds/iaict-portal/issues/30) OPEN, Cloudflare Preview [#32](https://github.com/ntdung-tds/iaict-portal/issues/32) OPEN. Earlier RED CI history retained.
- **Next:** provision Containers-enabled authorization or approved isolated private scanner runtime; deploy actual real ClamAV job bridge and secrets with R2/receipt CAS and hosted EICAR; verify 8 real CMS roles and negative E2E before enabling staging upload. Do not silently claim hosted PASS or deploy production.

**Continuity:** rev66 canonical only after docs PR merge/readback. Historical Moment below kept.

---

## Historical PCS Moment (Revision 65)

**PCS Universal 3.2.0 · Solo · Revision 65 checkpoint PR · B3.10 isolated Media scanner source MERGED · IAM PAUSED · production HOLD**

- **2026-11-04 11:12 ICT:** [PR #104](https://github.com/ntdung-tds/iaict-portal/pull/104) grouped source MERGED dev SHA `76bed3eecab94cf1c3f5bf4174d132291d5e96b4`. Isolated Pillow 13 full decoder, ClamAV zINSTREAM runner, cross-runtime HMAC receipt, forward-only 0026 private D1 evidence, original+derivative R2 SHA readback, revision CAS and private derivative cleanup. Existing 0025 migration unchanged.
- **Final reviewed head `4696ab9a`:** [Portal CI #41771159409](https://github.com/ntdung-tds/iaict-portal/actions/runs/41771159409) **4/4 PASS**, **724/724 Vitest**, **7/7 Pillow Python with FAKE AV socket**, **41/41 local Chromium** (CMS session mocked). [Real PUBLIC old-Worker #41771159404](https://github.com/ntdung-tds/iaict-portal/actions/runs/41771159404): 24/24 Chromium + 24/24 HTTP **PASS**; does not exercise new Media source.
- **Prior RED runs retained:** typecheck failure [#41770544134](https://github.com/ntdung-tds/iaict-portal/actions/runs/41770544134); Pillow WebP static/animation classification failure [#41770664892](https://github.com/ntdung-tds/iaict-portal/actions/runs/41770664892), both fixed and retested. OPS original intermittent 503 [#30](https://github.com/ntdung-tds/iaict-portal/issues/30) remains OPEN.
- **Exact postmerge SOURCE jobs:** [Portal #41771522866](https://github.com/ntdung-tds/iaict-portal/actions/runs/41771522866), [old-Worker staging #41771522878](https://github.com/ntdung-tds/iaict-portal/actions/runs/41771522878) **PASS exact merged SHA**: Portal 4/4 and public old-Worker 24/24 Chromium + 24/24 HTTP, 0 new 503; **NOT hosted Media acceptance**.
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
