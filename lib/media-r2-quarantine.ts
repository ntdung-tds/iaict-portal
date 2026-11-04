/**
 * B3.8 private quarantine upload service. NO scan verdict, image decoder,
 * public URL, direct R2 read, or new MIME formats. Staging-only, opt-in gate.
 */
import type { D1DatabaseLike, D1PreparedStatementLike } from "./cloudflare-db";
import { MEDIA_POLICY } from "./media-policy";
import { validateMediaUploadPreflight } from "./media-upload-contract";
import type { NewsroomActor } from "./newsroom-auth";
import type { MediaR2BucketLike } from "./media-r2-runtime";

export type QuarantineResult =
  | Readonly<{ ok: true; status: 201 | 200; id: string; state: "QUARANTINED"; requiresScan: true; publicUrl: null }>
  | Readonly<{ ok: false; status: 400 | 403 | 409 | 413 | 415 | 429 | 503; code: string }>;

export const MEDIA_STAGING_SCOPE_ID = "cms-main";
const IDEMPOTENCY = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;
const BYTE_LENGTH_GETTER =
  Object.getOwnPropertyDescriptor(Object.getPrototypeOf(Uint8Array.prototype), "byteLength")?.get;
const QUOTA_STATES = "('RESERVED','QUARANTINED','ORPHAN_PENDING_PURGE','REVOKED')";
const SHA_PATTERN = /^[a-f0-9]{64}$/;

type UploadRow = { id: string; state: string; byte_length: number; mime_type: string; content_sha256: string | null };

function failure(code: string, status: 400 | 403 | 409 | 413 | 415 | 429 | 503 = 400): QuarantineResult {
  return { ok: false, status, code };
}
function changed(result: unknown): number {
  if (!result || typeof result !== "object") return -1;
  try {
    const r = result as { success?: boolean; meta?: { changes?: unknown } };
    return r.success !== false && typeof r.meta?.changes === "number" && Number.isSafeInteger(r.meta.changes)
      ? r.meta.changes : -1;
  } catch { return -1; }
}
function hex(buffer: ArrayBuffer): string {
  return [...new Uint8Array(buffer)].map(b => b.toString(16).padStart(2,"0")).join("");
}
async function digest(bytes: Uint8Array): Promise<string> {
  return hex(await crypto.subtle.digest("SHA-256", new Uint8Array(bytes)));
}
function authorizeOrigin(req: Request): boolean {
  try {
    const target = new URL(req.url);
    return target.protocol === "https:" || target.hostname === "localhost" || target.hostname === "127.0.0.1"
      ? req.headers.get("origin") === target.origin : false;
  } catch { return false; }
}

type BoundedRead =
  | { ok: true; bytes: Uint8Array<ArrayBuffer>; chunkCount: number }
  | { ok: false; code: "INVALID_BODY" | "EMPTY_BODY" | "BODY_TOO_LARGE" | "TOO_MANY_CHUNKS" | "UPLOAD_TIMEOUT" };

/** Read bounded bytes without request.arrayBuffer() and without buffering beyond 10 MiB. */
export async function readBoundedMediaRequest(
  request: Request, maxBytes: number = MEDIA_POLICY.file.maxBytes,
  maxChunks: number = MEDIA_POLICY.file.maxChunks,
  deadlineMs: number = MEDIA_POLICY.file.receiveDeadlineMs,
): Promise<BoundedRead> {
  if (!request.body || !Number.isSafeInteger(maxBytes) || maxBytes <= 0 ||
      !Number.isSafeInteger(maxChunks) || maxChunks <= 0 ||
      !Number.isSafeInteger(deadlineMs) || deadlineMs <= 0) return { ok: false, code: "INVALID_BODY" };

  let reader: ReadableStreamDefaultReader<Uint8Array> | undefined;
  let timer: ReturnType<typeof setTimeout> | undefined;
  const parts: Uint8Array<ArrayBuffer>[] = [];
  let total = 0, count = 0, timedOut = false;
  try {
    reader = request.body.getReader() as ReadableStreamDefaultReader<Uint8Array>;
    const timeout = new Promise<never>((_resolve, reject) => {
      timer = setTimeout(() => { timedOut = true; reject(new Error("UPLOAD_TIMEOUT")); }, deadlineMs);
    });
    while (true) {
      const result = await Promise.race([reader.read(), timeout]);
      if (!result || typeof result !== "object" || typeof result.done !== "boolean")
        return { ok: false, code: "INVALID_BODY" };
      if (result.done) break;
      count++;
      if (count > maxChunks) return { ok: false, code: "TOO_MANY_CHUNKS" };
      const value = result.value;
      if (!(value instanceof Uint8Array)) return { ok: false, code: "INVALID_BODY" };
      const size = BYTE_LENGTH_GETTER?.call(value);
      if (typeof size !== "number" || !Number.isSafeInteger(size) || size < 0)
        return { ok: false, code: "INVALID_BODY" };
      if (size > maxBytes - total) return { ok: false, code: "BODY_TOO_LARGE" };
      const copy = new Uint8Array(size);
      Uint8Array.prototype.set.call(copy, value, 0);
      parts.push(copy);
      total += size;
    }
    if (total === 0) return { ok: false, code: "EMPTY_BODY" };
    const bytes = new Uint8Array(total);
    let pos = 0;
    for (const part of parts) { bytes.set(part, pos); pos += part.byteLength; }
    return { ok: true, bytes, chunkCount: count };
  } catch {
    return { ok: false, code: timedOut ? "UPLOAD_TIMEOUT" : "INVALID_BODY" };
  } finally {
    if (timer) clearTimeout(timer);
    // Cancel on all failures and when timed out. No private data in logs.
    try { void reader?.cancel().catch(() => undefined); } catch { /* best effort */ }
    try { reader?.releaseLock(); } catch { /* best effort */ }
  }
}

const reserveSql = `
  INSERT INTO media_r2_quarantine_uploads (
    id, scope_id, actor_user_id, idempotency_key, storage_key,
    mime_type, display_filename, byte_length, state
  )
  SELECT ?, ?, ?, ?, ?, ?, ?, ?, 'RESERVED'
  WHERE
    (SELECT COUNT(*) FROM media_r2_quarantine_uploads
       WHERE actor_user_id=? AND created_at>=datetime('now','-1 hour')
       AND state IN ('RESERVED','QUARANTINED')) < ?
    AND (SELECT COUNT(*) FROM media_r2_quarantine_uploads
       WHERE scope_id=? AND created_at>=datetime('now','start of day')
       AND state IN ('RESERVED','QUARANTINED')) < ?
    AND COALESCE((SELECT SUM(byte_length) FROM media_r2_quarantine_uploads
       WHERE scope_id=? AND created_at>=datetime('now','start of day')
       AND state IN ('RESERVED','QUARANTINED')),0) + ? <= ?
    AND COALESCE((SELECT SUM(byte_length) FROM media_r2_quarantine_uploads
       WHERE scope_id=? AND state IN ('RESERVED','QUARANTINED','ORPHAN_PENDING_PURGE','REVOKED')),0) + ? <= ?
    AND (SELECT COUNT(*) FROM media_r2_quarantine_uploads
       WHERE actor_user_id=? AND state='RESERVED') < ?
`;
export const MEDIA_R2_RESERVE_SQL = reserveSql;

function audit(db: D1DatabaseLike, actor: NewsroomActor, id: string, action: string, state: string): D1PreparedStatementLike {
  return db.prepare(`INSERT INTO audit_logs(id,actor_user_id,action,entity_type,entity_id,metadata_json,created_at)
    SELECT ?, ?, ?, 'media_r2_quarantine', id, ?, datetime('now')
    FROM media_r2_quarantine_uploads WHERE id=? AND actor_user_id=? AND state=?`)
    .bind(crypto.randomUUID(), actor.id, action, JSON.stringify({ state, policy: MEDIA_POLICY.id }), id, actor.id, state);
}

async function findExisting(db: D1DatabaseLike, actorId: string, idem: string): Promise<UploadRow | null> {
  return db.prepare(`SELECT id,state,byte_length,mime_type,content_sha256
    FROM media_r2_quarantine_uploads
    WHERE scope_id=? AND actor_user_id=? AND idempotency_key=? LIMIT 1`)
    .bind(MEDIA_STAGING_SCOPE_ID, actorId, idem).first<UploadRow>();
}

/** Returns no storage key or upload contents to the client. */
export async function submitPrivateMediaQuarantine(
  request: Request,
  actor: NewsroomActor,
  db: D1DatabaseLike,
  bucket: MediaR2BucketLike,
): Promise<QuarantineResult> {
  if (!actor.roles.some(r => r === "admin" || r === "editor")) return failure("ROLE_DENIED",403);
  if (!authorizeOrigin(request)) return failure("ORIGIN_DENIED",403);
  if (!MEDIA_POLICY.storage.privateR2 || MEDIA_POLICY.storage.directR2PublicAccess)
    return failure("PRIVATE_STORAGE_REQUIRED",503);
  const idem = request.headers.get("idempotency-key");
  if (!idem || !IDEMPOTENCY.test(idem)) return failure("INVALID_IDEMPOTENCY",400);
  const mime = request.headers.get("content-type")?.trim().toLowerCase();
  if (!mime || !MEDIA_POLICY.file.mimeTypes.some(t => t === mime)) return failure("UNSUPPORTED_MIME",415);
  const rawName = request.headers.get("x-media-filename");
  let name = "";
  try { name = decodeURIComponent(rawName ?? ""); }
  catch { return failure("INVALID_FILENAME",400); }
  const headerLength = request.headers.get("content-length");
  let declared: number | undefined;
  if (headerLength !== null) {
    if (!/^\d{1,10}$/.test(headerLength)) return failure("INVALID_CONTENT_LENGTH",400);
    declared = Number(headerLength);
    if (declared > MEDIA_POLICY.file.maxBytes) return failure("BODY_TOO_LARGE",413);
  }
  const body = await readBoundedMediaRequest(request);
  if (!body.ok) return failure(body.code, body.code === "BODY_TOO_LARGE" ? 413 : body.code === "UPLOAD_TIMEOUT" ? 503 : 400);
  const verified = validateMediaUploadPreflight({
    filename: name, declaredMimeType: mime, bytes: body.bytes, declaredSize: declared,
  },{ allowedMimeTypes: MEDIA_POLICY.file.mimeTypes, maxBytes: MEDIA_POLICY.file.maxBytes });
  if (!verified.ok) return failure(verified.code,verified.code==="SIGNATURE_MISMATCH" ? 415 : 400);

  const sha256 = await digest(body.bytes);
  if (!SHA_PATTERN.test(sha256)) return failure("INVALID_DIGEST",503);

  let old: UploadRow | null;
  try { old = await findExisting(db, actor.id, idem); }
  catch { return failure("MEDIA_SCHEMA_UNAVAILABLE",503); }
  if (old) {
    if (old.state === "QUARANTINED" && old.byte_length === verified.byteLength &&
        old.mime_type === verified.mimeType && old.content_sha256 === sha256) {
      return { ok: true, status: 200, id: old.id, state: "QUARANTINED", requiresScan: true, publicUrl: null };
    }
    return failure("IDEMPOTENCY_CONFLICT",409);
  }

  const id = crypto.randomUUID();
  const key = "quarantine/v2/" + MEDIA_STAGING_SCOPE_ID + "/" + id;
  try {
    const reserved = await db.batch([
      db.prepare(reserveSql).bind(
        id, MEDIA_STAGING_SCOPE_ID, actor.id, idem, key,
        verified.mimeType, verified.displayFilename, verified.byteLength,
        actor.id, MEDIA_POLICY.limits.uploadsPerActorHour,
        MEDIA_STAGING_SCOPE_ID, MEDIA_POLICY.limits.uploadsPerScopeDay,
        MEDIA_STAGING_SCOPE_ID, verified.byteLength, MEDIA_POLICY.limits.bytesPerScopeDay,
        MEDIA_STAGING_SCOPE_ID, verified.byteLength, MEDIA_POLICY.limits.storedBytesPerScope,
        actor.id, MEDIA_POLICY.limits.inFlightPerActor,
      ),
      audit(db,actor,id,"media.quarantine.reserve","RESERVED"),
    ]);
    if (changed(reserved[0]) !== 1 || changed(reserved[1]) !== 1)
      return failure("MEDIA_QUOTA_OR_RESERVATION_CONFLICT",429);
  } catch {
    // Constraint failures may be simultaneous replays; never store duplicate R2.
    return failure("MEDIA_QUOTA_OR_RESERVATION_CONFLICT",409);
  }

  let putSucceeded = false;
  try {
    const result = await bucket.put(key, body.bytes, {
      httpMetadata: { contentType: verified.mimeType, cacheControl:"private, no-store" },
      customMetadata: { policyId: MEDIA_POLICY.id, sha256 },
    });
    if (result === null || result === undefined) throw Error("R2_PUT_FAILED");
    putSucceeded = true;
    const updated = await db.batch([
      db.prepare(`UPDATE media_r2_quarantine_uploads
        SET state='QUARANTINED', content_sha256=?, revision=revision+1, updated_at=datetime('now')
        WHERE id=? AND scope_id=? AND actor_user_id=? AND state='RESERVED' AND revision=0`)
        .bind(sha256,id,MEDIA_STAGING_SCOPE_ID,actor.id),
      audit(db,actor,id,"media.quarantine.write","QUARANTINED"),
    ]);
    if (changed(updated[0]) !== 1 || changed(updated[1]) !== 1)
      throw Error("D1_COMMIT_FAILED");
    return { ok:true,status:201,id,state:"QUARANTINED",requiresScan:true,publicUrl:null };
  } catch {
    let deleted = false;
    try { await bucket.delete(key); deleted = true; }
    catch { /* compensate later; preserve durable orphan ledger */ }
    try {
      await db.batch([
        db.prepare(`UPDATE media_r2_quarantine_uploads
          SET state=?, revision=revision+1, updated_at=datetime('now')
          WHERE id=? AND actor_user_id=? AND state='RESERVED'`)
          .bind(deleted?"FAILED":"ORPHAN_PENDING_PURGE",id,actor.id),
        audit(db,actor,id,"media.quarantine.failed",deleted?"FAILED":"ORPHAN_PENDING_PURGE"),
      ]);
    } catch { /* state remains RESERVED; periodic reconciliation required */ }
    // R2 might have accepted bytes even when PUT threw. Never claim a clean scan.
    void putSucceeded;
    return failure("QUARANTINE_PERSIST_FAILED",503);
  }
}
