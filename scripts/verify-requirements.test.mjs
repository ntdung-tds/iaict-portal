import {describe,it} from "node:test";
import assert from "node:assert/strict";
import {MODULES,FROZEN_SRS_BLOB_SHA,requirementsImpact,validateRequirements} from "./verify-requirements.mjs";

describe("IAICT SRS freeze and per-module change-log governance",()=>{
 it("requires changelog on source code PRs, not on ordinary docs-only changes",()=>{
   assert.equal(requirementsImpact(["app/login/page.tsx"]).ok,false);
   assert.equal(requirementsImpact(["lib/totp.ts","docs/requirements/iam-access/thaydoi.md"]).ok,true);
   assert.equal(requirementsImpact(["docs/qa/IAICT_TEST_RUNS.md"]).ok,true);
   assert.equal(requirementsImpact(["cloudflare/migrations/0025_test.sql","docs/requirements/iam-access/thaydoi.md"]).ok,true);
 });
 it("fails whenever SRS content diverges from its frozen unapproved placeholder",()=>{
   const exists=()=>true;
   const read=path=>path.endsWith("SRS.md")?"CHƯA_CHỐT / FROZEN không phải SRS đã phê duyệt":path.endsWith("README.md")?"Chốt SRS ≠ bàn giao":"## Nhật ký thay đổi\nCHƯA_CHỐT PR/Commit\n### CHG-MODULE-20261031-01\n";
   const hash=()=> "incorrect";
   const errors=validateRequirements({exists,read,hash});
   assert.ok(errors.some(s=>s.startsWith("SRS_CHANGED_WITHOUT_OWNER_CHOT")));
 });
 it("detects missing logs and incomplete records rather than claiming documentation done",()=>{
   const exists=path=>!path.includes("/portal-ui/thaydoi.md");
   const read=path=>path.endsWith("SRS.md")?"CHƯA_CHỐT / FROZEN không phải SRS đã phê duyệt":path.endsWith("README.md")?"Chốt SRS ≠ bàn giao":"## Nhật ký thay đổi\nCHƯA_CHỐT PR/Commit\n### CHG-MODULE-20261031-01\n";
   const errors=validateRequirements({exists,read,hash:()=>FROZEN_SRS_BLOB_SHA});
   assert.ok(errors.some(x=>x.includes("portal-ui/thaydoi.md")));
   assert.ok(errors.some(x=>x.includes("Duplicate CHG ID")));
 });
 it("supports all declared 14 modules without duplicate names",()=>{
   assert.equal(MODULES.length,14);
   assert.equal(new Set(MODULES).size,MODULES.length);
 });
});
