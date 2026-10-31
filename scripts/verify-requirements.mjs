/**
 * IAICT SRS governance: fail-closed until the owner explicitly "chốt".
 * This validates the current UNAPPROVED placeholder, not SRS completeness.
 * When owner chốt an exact baseline, authorize a separate reviewed PR
 * updating this pinned SHA and attaching the owner's approval reference.
 */
import {existsSync, readFileSync} from "node:fs";
import {execFileSync} from "node:child_process";
import {fileURLToPath} from "node:url";
import {resolve} from "node:path";

export const SRS_PATH="docs/requirements/SRS.md";
export const FROZEN_SRS_BLOB_SHA="a2e46b4b3437bc37fd44b7548327bbd71b31cc56";
export const MODULES=[
 "portal-ui","gioi-thieu","san-pham","giai-phap","chuyen-giao",
 "dao-tao","du-an","tin-tuc","lien-he-lead","cms-workflow",
 "iam-access","media-r2","seo-search","platform-release",
];
const CHANGED_CODE=/^(app\/|lib\/|components\/|cloudflare\/|e2e\/|worker\.ts$|cloudflare\.config\.ts$|wrangler\.)/;
const CHANGE_LOG=/^docs\/requirements\/(?:[^/]+\/)?thaydoi\.md$/;

export function requirementsImpact(changedFiles) {
 const codeFiles=changedFiles.filter(path=>CHANGED_CODE.test(path));
 const logs=changedFiles.filter(path=>CHANGE_LOG.test(path));
 return {codeFiles,logs,ok:codeFiles.length===0||logs.length>0};
}
export function validateRequirements({
 exists=(path)=>existsSync(path),
 read=(path)=>readFileSync(path,"utf8"),
 hash=(path)=>execFileSync("git",["hash-object","--",path],{encoding:"utf8"}).trim(),
}={}) {
 const errors=[];
 if(!exists(SRS_PATH))return ["Missing SRS placeholder"];
 if(hash(SRS_PATH)!==FROZEN_SRS_BLOB_SHA)errors.push("SRS_CHANGED_WITHOUT_OWNER_CHOT: frozen baseline content differs from approved placeholder; do NOT update SRS during development");
 const root=read(SRS_PATH);
 if(!root.includes("CHƯA_CHỐT / FROZEN")||!root.includes("không phải SRS đã phê duyệt"))
   errors.push("SRS baseline status missing or silently promoted");
 const index="docs/requirements/README.md";
 if(!exists(index))errors.push("Missing requirements index");
 else if(!read(index).includes("Chốt SRS ≠")&&!read(index).includes("bàn giao"))
   errors.push("Missing separate chốt / bàn giao policy");
 const ids=new Set();
 for(const m of MODULES){
   const p=`docs/requirements/${m}/thaydoi.md`;
   if(!exists(p)){errors.push(`Missing per-module change log: ${p}`);continue;}
   const t=read(p);
   if(!t.includes("## Nhật ký thay đổi")||!t.includes("CHƯA_CHỐT")||!t.includes("PR/Commit"))
     errors.push(`Incomplete change log template: ${p}`);
   const found=[...t.matchAll(/^### (CHG-[A-Z0-9-]+-\d{8}-\d{2})\b/gm)].map(x=>x[1]);
   if(!found.length)errors.push(`Missing detailed initial CHG: ${p}`);
   for(const id of found){
     if(ids.has(id))errors.push(`Duplicate CHG ID: ${id}`);
     ids.add(id);
   }
 }
 return errors;
}
export function getPrChanges({base=process.env.GITHUB_BASE_REF}={}) {
 if(!base||!/^[a-zA-Z0-9._/-]+$/.test(base)||base.startsWith("-"))
   throw Error("Invalid base branch");
 return execFileSync("git",["diff","--name-only",`origin/${base}...HEAD`],{encoding:"utf8"}).trim().split("\n").filter(Boolean);
}
if(process.argv[1]&&fileURLToPath(import.meta.url)===resolve(process.argv[1])){
 const errors=validateRequirements();
 if(process.env.GITHUB_EVENT_NAME==="pull_request"){
  const impact=requirementsImpact(getPrChanges());
  if(!impact.ok)errors.push(`SOURCE_CHANGED_WITHOUT_THAYDOI: ${impact.codeFiles.length} source files changed without requirements change-log entry in the PR`);
 }
 for(const error of errors)console.error("[requirements] FAIL "+error);
 if(errors.length)process.exitCode=1;
 else console.log(`[requirements] PASS: frozen SRS untouched; ${MODULES.length} module logs available; chốt vs bàn giao distinct; PR impact checked.`);
}
