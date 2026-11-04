/** B3.10 private-only evidence adapter: NOT wired to HTTP, no public serving. */
import type { D1DatabaseLike } from "./cloudflare-db";
import type { MediaR2BucketLike } from "./media-r2-runtime";
import { MEDIA_POLICY } from "./media-policy";
import { verifyMediaScanClaim, scanClaimBytes, type SignedScanClaim } from "./media-scan-attestation";

type QuarantineRow = {
  id:string; state:string; revision:number; scope_id:string; storage_key:string;
  mime_type:string; byte_length:number; content_sha256:string|null;
};
type ReadbackObject = {size:number;arrayBuffer():Promise<ArrayBuffer>};
export type EvidenceResult =
  | {ok:true;status:201;state:"SCAN_PASSED_PRIVATE";id:string;publicUrl:null}
  | {ok:false;status:400|409|503;code:string};
const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

function changes(v: unknown):number {
  if(!v || typeof v!=="object")return -1;
  const r=v as {success?:boolean;meta?:{changes?:unknown}};
  return r.success!==false && Number.isSafeInteger(r.meta?.changes) ? r.meta!.changes as number : -1;
}
async function readExactPrivateObject(
  bucket: MediaR2BucketLike, key:string, len:number, sha:string,
):Promise<boolean> {
  if(typeof bucket.get!=="function")return false;
  const obj=await bucket.get(key) as ReadbackObject|null;
  if(!obj || !Number.isSafeInteger(obj.size) || obj.size!==len || len<=0 ||
    len>MEDIA_POLICY.file.maxBytes)return false;
  const value=await obj.arrayBuffer();
  if(value.byteLength!==len)return false;
  const bytes=new Uint8Array(await crypto.subtle.digest("SHA-256",value));
  const actual=[...bytes].map(x=>x.toString(16).padStart(2,"0")).join("");
  return actual===sha;
}

/** Provisioned may ONLY be derived from authenticated trusted job config.
 * This function is not a request handler and has no live callers.
 * A local synthetic test may explicitly provision it; not evidence of hosted AV.
 */
export async function storePrivateMediaScanEvidence(
  db:D1DatabaseLike, bucket:MediaR2BucketLike,
  receipt:SignedScanClaim, secret:Uint8Array|undefined,
  options:Readonly<{provisioned:boolean;nowMs?:number}>,
):Promise<EvidenceResult> {
  if(options.provisioned!==true || !secret || secret.byteLength<32)
    return {ok:false,status:503,code:"SCANNER_NOT_PROVISIONED"};
  const uploadId=receipt?.claim?.uploadId;
  if(typeof uploadId!=="string" || !UUID.test(uploadId))
    return {ok:false,status:400,code:"INVALID_UPLOAD_ID"};
  let row:QuarantineRow|null;
  try {
    row=await db.prepare(`SELECT id,state,revision,scope_id,storage_key,mime_type,
      byte_length,content_sha256 FROM media_r2_quarantine_uploads WHERE id=?`)
      .bind(uploadId).first<QuarantineRow>();
  } catch {return {ok:false,status:503,code:"MEDIA_SCHEMA_UNAVAILABLE"};}
  if(!row || row.state!=="QUARANTINED" || !row.content_sha256 ||
    !Number.isSafeInteger(row.revision) ||
    row.storage_key!==`quarantine/v2/cms-main/${uploadId}`)
    return {ok:false,status:409,code:"SOURCE_NOT_QUARANTINED"};
  const result=await verifyMediaScanClaim(receipt,secret,{
    uploadId:row.id,scopeId:row.scope_id,sourceRevision:row.revision,
    sourceSha256:row.content_sha256,sourceMime:row.mime_type,
  },options.nowMs);
  if(!result.ok)return {ok:false,status:400,code:result.code};
  const c=result.claim;
  // Never trust an attestation without matching real private source AND derivative bytes.
  try {
    if(!await readExactPrivateObject(bucket,row.storage_key,row.byte_length,row.content_sha256) ||
      !await readExactPrivateObject(bucket,c.derivativeKey,c.derivativeSize,c.derivativeSha256))
      return {ok:false,status:503,code:"PRIVATE_R2_READBACK_MISMATCH"};
  } catch{return {ok:false,status:503,code:"PRIVATE_R2_READBACK_UNAVAILABLE"};}
  const content=scanClaimBytes(c);
  if(!content)return {ok:false,status:400,code:"INVALID_RECEIPT"};
  const proofString=c.nonce+":"+receipt.signature+":"+new TextDecoder().decode(content);
  const attHash=new Uint8Array(await crypto.subtle.digest("SHA-256",new TextEncoder().encode(proofString)));
  const attestationHash=[...attHash].map(x=>x.toString(16).padStart(2,"0")).join("");
  const id=crypto.randomUUID();
  try {
    // D1 batch is transactional. If another janitor or scan consumes revision,
    // the INSERT SELECT finds no eligible row; no private state is published.
    const writes=await db.batch([
      db.prepare(`UPDATE media_r2_quarantine_uploads
        SET revision=revision+1,updated_at=datetime('now')
        WHERE id=? AND scope_id=? AND state='QUARANTINED'
        AND content_sha256=? AND revision=?`)
        .bind(row.id,row.scope_id,row.content_sha256,row.revision),
      db.prepare(`INSERT INTO media_r2_scan_evidence (
        id,source_upload_id,scope_id,source_revision,source_sha256,
        derivative_key,derivative_sha256,derivative_size,derivative_mime,
        width,height,scanner_engine,attestation_sha256,signer_nonce,
        scanned_at_ms,state)
      SELECT ?,id,scope_id,?,content_sha256,?,?,?,?,?,?,?,?,?,?,'SCAN_PASSED_PRIVATE'
      FROM media_r2_quarantine_uploads WHERE id=? AND state='QUARANTINED'
      AND revision=? AND content_sha256=?`)
        .bind(id,row.revision,c.derivativeKey,c.derivativeSha256,c.derivativeSize,
          c.derivativeMime,c.width,c.height,c.engine,attestationHash,c.nonce,
          c.signedAtMs,row.id,row.revision+1,row.content_sha256),
      db.prepare(`INSERT INTO audit_logs
        (id,actor_user_id,action,entity_type,entity_id,metadata_json,created_at)
      SELECT ?,source.actor_user_id,'media.scan.private_receipt',
      'media_r2_scan_evidence',e.id,?,datetime('now')
      FROM media_r2_scan_evidence e
      JOIN media_r2_quarantine_uploads source ON source.id=e.source_upload_id
      WHERE e.id=?`)
        .bind(crypto.randomUUID(),JSON.stringify({policy:MEDIA_POLICY.id,privateOnly:true}),id),
    ]);
    if(writes.length!==3 || writes.some(x=>changes(x)!==1))
      return {ok:false,status:409,code:"SCAN_CAS_CONFLICT"};
    return {ok:true,status:201,state:"SCAN_PASSED_PRIVATE",id,publicUrl:null};
  } catch {return {ok:false,status:409,code:"SCAN_CAS_OR_SCHEMA_CONFLICT"};}
}
