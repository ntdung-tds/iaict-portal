import { describe, expect, it } from "vitest";
import { scanClaimBytes, verifyMediaScanClaim, type ScanClaim } from "./media-scan-attestation";
import { MEDIA_POLICY } from "./media-policy";

const uuid="4ec14136-a36e-45bf-94f0-4d61e3f79893";
const sha="a".repeat(64), dsha="b".repeat(64);
const secret=new Uint8Array(32).fill(11);
const now=1793760000000;
function claim(patch: Partial<ScanClaim> = {}): ScanClaim {
 return {
  version:"iaict.media.scan.v1",policyId:MEDIA_POLICY.id,uploadId:uuid,scopeId:"cms-main",
  sourceRevision:1,sourceSha256:sha,sourceMime:"image/png",
  derivativeKey:`derivative/staged/v1/cms-main/${uuid}/${dsha}.webp`,
  derivativeSha256:dsha,derivativeSize:2048,derivativeMime:"image/webp",width:120,height:60,
  engine:"clamav",verdict:"CLEAN",signedAtMs:now,nonce:"c".repeat(32),...patch,
 };
}
async function sign(c: ScanClaim) {
 const bytes=scanClaimBytes(c); if(!bytes) throw Error("invalid fixture");
 const key=await crypto.subtle.importKey("raw",secret,{name:"HMAC",hash:"SHA-256"},false,["sign"]);
 const sig=new Uint8Array(await crypto.subtle.sign("HMAC",key,new Uint8Array(bytes)));
 return {claim:c,signature:[...sig].map(n=>n.toString(16).padStart(2,"0")).join("")};
}
const expected={uploadId:uuid,scopeId:"cms-main",sourceRevision:1,sourceSha256:sha,sourceMime:"image/png"};
describe("B3.10 scanner attestation verified locally only",()=>{
 it("accepts a matching fresh authenticated envelope",async()=>{
   const r=await verifyMediaScanClaim(await sign(claim()),secret,expected,now);
   expect(r.ok).toBe(true);
 });
 it("fails closed when signer secret is absent",async()=>{
   expect((await verifyMediaScanClaim(await sign(claim()),undefined,expected,now)).ok).toBe(false);
 });
 it("denies forged signature, tampering, wrong source hash and revision",async()=>{
   const valid=await sign(claim());
   expect((await verifyMediaScanClaim({...valid,signature:"0".repeat(64)},secret,expected,now)).ok).toBe(false);
   expect((await verifyMediaScanClaim({...valid,claim:{...valid.claim,width:64}},secret,expected,now)).ok).toBe(false);
   expect((await verifyMediaScanClaim(valid,secret,{...expected,sourceSha256:"f".repeat(64)},now)).ok).toBe(false);
   expect((await verifyMediaScanClaim(valid,secret,{...expected,sourceRevision:2},now)).ok).toBe(false);
 });
 it("rejects stale, future, hostile and oversized images even when signed",async()=>{
   for(const c of [
    claim({signedAtMs:now-16*60*1000}),
    claim({signedAtMs:now+31_000}),
    claim({engine:"clamav",verdict:"FOUND" as never}),
    claim({width:8192,height:8192}),
    claim({derivativeSize:MEDIA_POLICY.file.maxBytes+1}),
    claim({derivativeKey:"public/evil.webp"}),
    claim({scopeId:"other"}),
   ]) {
    const bytes=scanClaimBytes(c);
    if(bytes)expect((await verifyMediaScanClaim(await sign(c),secret,expected,now)).ok).toBe(false);
    else expect(bytes).toBeNull();
   }
 });
 it("denies unbounded object properties, malformed nonce and wrong policy",async()=>{
   expect(scanClaimBytes({...claim(),extra:"bypass"})).toBeNull();
   expect(scanClaimBytes(claim({nonce:"oops"}))).toBeNull();
   expect(scanClaimBytes(claim({policyId:"wrong"}))).toBeNull();
   expect(scanClaimBytes({})).toBeNull();
 });
});
