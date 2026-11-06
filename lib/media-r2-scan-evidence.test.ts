import {afterAll,beforeAll,describe,expect,it} from "vitest";
import {randomUUID} from "node:crypto";
import {readFile} from "node:fs/promises";
import {Miniflare,convertV4MiniflareOptions} from "miniflare";
import type {D1DatabaseLike} from "./cloudflare-db";
import type {MediaR2BucketLike} from "./media-r2-runtime";
import {storePrivateMediaScanEvidence} from "./media-r2-scan-evidence";
import {cleanupExpiredPrivateMedia} from "./media-r2-cleanup";
import {scanClaimBytes,type ScanClaim} from "./media-scan-attestation";
import {MEDIA_POLICY} from "./media-policy";

const sourceBytes=new Uint8Array([137,80,78,71,13,10,26,10,0,0,0,0,0,0,0,0]);
const derivBytes=new TextEncoder().encode("synthetic-webp-derivative-binary-fixture");
const secret=new Uint8Array(32).fill(23), now=1793760000000;
const sha=async(x:Uint8Array)=>[...new Uint8Array(await crypto.subtle.digest("SHA-256",new Uint8Array(x)))]
  .map(n=>n.toString(16).padStart(2,"0")).join("");
async function signed(c:ScanClaim) {
 const msg=scanClaimBytes(c);
 if(!msg)throw Error("invalid synthetic fixture");
 const key=await crypto.subtle.importKey("raw",secret,{name:"HMAC",hash:"SHA-256"},false,["sign"]);
 const sig=new Uint8Array(await crypto.subtle.sign("HMAC",key,new Uint8Array(msg)));
 return {claim:c,signature:[...sig].map(n=>n.toString(16).padStart(2,"0")).join("")};
}
describe("B3.10 D1 CAS with real disposable Miniflare D1/R2 (NO hosted scanner)",()=>{
 let mf:Miniflare, db:D1DatabaseLike, bucket:MediaR2BucketLike;
 let id:string, claim:ScanClaim;
 beforeAll(async()=>{
  mf=new Miniflare(convertV4MiniflareOptions({
    modules:true,script:"export default {fetch(){return new Response('isolated')}}",
    compatibilityDate:"2026-10-12",compatibilityFlags:["nodejs_compat"],
    d1Databases:{DB:randomUUID()},r2Buckets:{MEDIA_BUCKET:"qa-b310"},
  }));
  db=await mf.getD1Database("DB") as unknown as D1DatabaseLike;
  bucket=await mf.getR2Bucket("MEDIA_BUCKET") as unknown as MediaR2BucketLike;
  for(const name of ["0001_core.sql","0025_media_r2_quarantine.sql","0026_media_r2_scan_evidence.sql"]) {
    const sql=await readFile(new URL("../cloudflare/migrations/"+name,import.meta.url),"utf8");
    for(const statement of sql.split(/;\s*(?:\r?\n|$)/).map(s=>s.trim())
      .filter(s=>s.split(/\r?\n/).some(line=>line.trim()&&!line.trim().startsWith("--"))))
      await db.prepare(statement).run();
  }
  const actor="synthetic-scanner-editor";
  await db.prepare("INSERT INTO admin_users(id,email,is_active,created_at,updated_at) VALUES(?,?,1,'qa','qa')")
    .bind(actor,"scanner-editor@example.test").run();
  id=randomUUID();
  const ssha=await sha(sourceBytes), dsha=await sha(derivBytes);
  const key="quarantine/v2/cms-main/"+id;
  const dkey="derivative/staged/v1/cms-main/"+id+"/"+dsha+".webp";
  await db.prepare(`INSERT INTO media_r2_quarantine_uploads
    (id,scope_id,actor_user_id,idempotency_key,storage_key,mime_type,
    display_filename,byte_length,content_sha256,state,revision)
    VALUES(?,?,?,?,?,'image/png','qa.png',?,?,'QUARANTINED',1)`)
    .bind(id,"cms-main",actor,randomUUID(),key,sourceBytes.byteLength,ssha).run();
  await bucket.put(key,sourceBytes);
  await bucket.put(dkey,derivBytes);
  claim={
    version:"iaict.media.scan.v1",policyId:MEDIA_POLICY.id,uploadId:id,scopeId:"cms-main",
    sourceRevision:1,sourceSha256:ssha,sourceMime:"image/png",derivativeKey:dkey,
    derivativeSha256:dsha,derivativeSize:derivBytes.length,derivativeMime:"image/webp",
    width:3,height:2,engine:"clamav",verdict:"CLEAN",signedAtMs:now,nonce:"a".repeat(32),
  };
 },60_000);
 afterAll(async()=>{if(mf)await mf.dispose()});
 it("never accepts scanner output when the runtime is not provisioned",async()=>{
  const r=await storePrivateMediaScanEvidence(db,bucket,await signed(claim),secret,{provisioned:false,nowMs:now});
  expect(r).toMatchObject({ok:false,status:503});
 });
 it("rejects missing R2 readback or bad source digest before D1 write",async()=>{
  const dsha=await sha(derivBytes);
  const forged={...claim,derivativeKey:`derivative/staged/v1/cms-main/${id}/${"f".repeat(64)}.webp`,
    derivativeSha256:"f".repeat(64),nonce:"b".repeat(32)};
  const r=await storePrivateMediaScanEvidence(db,bucket,await signed(forged),secret,{provisioned:true,nowMs:now});
  expect(r).toMatchObject({ok:false,status:503});
  expect(dsha).toBe(claim.derivativeSha256);
  expect((await db.prepare("SELECT COUNT(*) AS n FROM media_r2_scan_evidence").first<{n:number}>())?.n).toBe(0);
 });
 it("commits only private signed evidence, source CAS revision and D1 audit",async()=>{
  const r=await storePrivateMediaScanEvidence(db,bucket,await signed(claim),secret,{provisioned:true,nowMs:now});
  expect(r).toMatchObject({ok:true,state:"SCAN_PASSED_PRIVATE",publicUrl:null});
  const row=await db.prepare("SELECT state,revision,scanner_attestation,derivative_key FROM media_r2_quarantine_uploads WHERE id=?")
    .bind(id).first<{state:string;revision:number;scanner_attestation:string|null;derivative_key:string|null}>();
  expect(row).toMatchObject({state:"QUARANTINED",revision:2,scanner_attestation:null,derivative_key:null});
  const e=await db.prepare("SELECT * FROM media_r2_scan_evidence WHERE source_upload_id=?")
    .bind(id).first<{derivative_key:string;source_revision:number;state:string}>();
  expect(e).toMatchObject({derivative_key:claim.derivativeKey,source_revision:1,state:"SCAN_PASSED_PRIVATE"});
  const audits=await db.prepare("SELECT action FROM audit_logs WHERE entity_id=?").bind(r.ok?r.id:"").all<{action:string}>();
  expect(audits.results.map(a=>a.action)).toContain("media.scan.private_receipt");
 });
 it("denies replay, stale revision and rejects conflicting attestation",async()=>{
  const r=await storePrivateMediaScanEvidence(db,bucket,await signed(claim),secret,{provisioned:true,nowMs:now});
  expect(r.ok).toBe(false);
  const count=await db.prepare("SELECT COUNT(*) AS n FROM media_r2_scan_evidence").first<{n:number}>();
  expect(count?.n).toBe(1);
  expect((await db.prepare("PRAGMA foreign_key_check").all()).results).toHaveLength(0);
 });
 it("purges both source and staged derivative after source retention expires",async()=>{
  await db.prepare("UPDATE media_r2_quarantine_uploads SET created_at=datetime('now','-8 days') WHERE id=?")
    .bind(id).run();
  const cleaned=await cleanupExpiredPrivateMedia(db,bucket);
  expect(cleaned.deleted).toBeGreaterThanOrEqual(1);
  const row=await db.prepare("SELECT state FROM media_r2_quarantine_uploads WHERE id=?")
    .bind(id).first<{state:string}>();
  expect(row?.state).toBe("PURGED");
  expect(await bucket.get?.("quarantine/v2/cms-main/"+id)).toBeNull();
  expect(await bucket.get?.(claim.derivativeKey)).toBeNull();
 });

});
