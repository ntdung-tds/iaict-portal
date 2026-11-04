import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { readFile } from "node:fs/promises";
import { randomUUID } from "node:crypto";
import { Miniflare, convertV4MiniflareOptions } from "miniflare";
import type { D1DatabaseLike } from "./cloudflare-db";
import type { NewsroomActor } from "./newsroom-auth";
import type { MediaR2BucketLike } from "./media-r2-runtime";
import { MEDIA_POLICY } from "./media-policy";
import { readBoundedMediaRequest, submitPrivateMediaQuarantine, MEDIA_STAGING_SCOPE_ID } from "./media-r2-quarantine";
import { cleanupExpiredPrivateMedia } from "./media-r2-cleanup";

const origin = "https://iaict-portal-staging.iaict-platform.workers.dev";
const tinyPng = Uint8Array.from([137,80,78,71,13,10,26,10,0,0,0,0,0,0,0,0]);
function upload(body: Uint8Array, patch: Record<string,string> = {}): Request {
  return new Request(origin + "/api/admin/cms/media/quarantine", {
    method: "POST",
    headers: {
      origin,
      "content-type": "image/png",
      "x-media-filename": "synthetic%20picture.png",
      "idempotency-key": randomUUID(),
      ...patch,
    },
    body: new Uint8Array(body),
  });
}

function memoryBucket(options: { putFails?: boolean; deleteFails?: boolean } = {}):
  MediaR2BucketLike & { objects: Map<string, Uint8Array<ArrayBuffer>> } {
  const objects = new Map<string, Uint8Array<ArrayBuffer>>();
  return {
    objects,
    async put(key, raw) {
      if (options.putFails) throw Error("SYNTHETIC_R2_FAILURE");
      if (!ArrayBuffer.isView(raw) || !(raw instanceof Uint8Array))
        throw Error("MUST_GET_UINT8_ARRAY");
      objects.set(key, new Uint8Array(raw));
      return { etag: "synthetic-etag" };
    },
    async delete(key) {
      if (options.deleteFails) throw Error("SYNTHETIC_DELETE_FAILURE");
      objects.delete(key);
    },
  };
}

describe("B3.8 real disposable D1 and synthetic private R2 quarantine — NOT deployed", () => {
  let mf: Miniflare;
  let db: D1DatabaseLike;
  const actor: NewsroomActor = {
    id: "synthetic-media-editor",email: "synthetic-media-editor@example.test",
    displayName: null,roles: ["editor"],
  };
  const viewer: NewsroomActor = { ...actor, roles: ["viewer"] };

  beforeAll(async () => {
    mf = new Miniflare(convertV4MiniflareOptions({
      modules: true,
      script: "export default {fetch(){return new Response('synthetic only')}}",
      compatibilityDate: "2026-10-12", compatibilityFlags: ["nodejs_compat"],
      d1Databases: { DB: randomUUID() },
      r2Buckets: { MEDIA_BUCKET: "qa-media-private" },
    }));
    db = await mf.getD1Database("DB") as unknown as D1DatabaseLike;
    for (const name of ["0001_core.sql","0025_media_r2_quarantine.sql"]) {
      const source = await readFile(new URL("../cloudflare/migrations/" + name,import.meta.url),"utf8");
      for (const statement of source.split(/;\s*(?:\r?\n|$)/).map(s=>s.trim())
        .filter(s => s.split(/\r?\n/).some(line => line.trim() && !line.trim().startsWith("--")))) {
        await db.prepare(statement).run();
      }
    }
    await db.prepare("INSERT INTO admin_users(id,email,is_active,created_at,updated_at) VALUES (?,?,1,'qa','qa')")
      .bind(actor.id,actor.email).run();
  },60_000);
  afterAll(async () => { if (mf) await mf.dispose(); });

  it("has a forward-only table with strict private states and foreign-key integrity", async () => {
    const rows = await db.prepare("PRAGMA table_info(media_r2_quarantine_uploads)").all<{name:string}>();
    expect(rows.results.map(x=>x.name)).toContain("storage_key");
    expect(rows.results.map(x=>x.name)).toContain("scanner_attestation");
    expect((await db.prepare("PRAGMA foreign_key_check").all()).results).toHaveLength(0);
    expect(MEDIA_POLICY.scan.serviceConfigured).toBe(false);
  });

  it("commits a quota reservation, R2 private object and D1 audit atomically per step", async () => {
    const bucket=memoryBucket();
    const req=upload(tinyPng);
    const result=await submitPrivateMediaQuarantine(req,actor,db,bucket);
    expect(result).toMatchObject({ok:true,status:201,state:"QUARANTINED",requiresScan:true,publicUrl:null});
    if (!result.ok) return;
    expect(bucket.objects.size).toBe(1);
    const row=await db.prepare("SELECT * FROM media_r2_quarantine_uploads WHERE id=?").bind(result.id).first<Record<string,unknown>>();
    expect(row?.state).toBe("QUARANTINED");
    expect(row?.revision).toBe(1);
    expect(row?.scope_id).toBe(MEDIA_STAGING_SCOPE_ID);
    expect(row?.byte_length).toBe(tinyPng.byteLength);
    expect(row?.content_sha256).toMatch(/^[a-f0-9]{64}$/);
    expect(row?.scanner_attestation).toBeNull();
    expect(row?.derivative_key).toBeNull();
    expect(row?.storage_key).toMatch(/^quarantine\/v2\/cms-main\/[0-9a-f-]{36}$/);
    const audits=await db.prepare("SELECT action FROM audit_logs WHERE entity_id=? ORDER BY created_at")
      .bind(result.id).all<{action:string}>();
    expect(audits.results.map(x=>x.action).sort()).toEqual(["media.quarantine.reserve","media.quarantine.write"]);
  });

  it("writes and reads back a real disposable Miniflare R2 object (not hosted)", async () => {
    const bucket = await mf.getR2Bucket("MEDIA_BUCKET");
    const result = await submitPrivateMediaQuarantine(
      upload(tinyPng),actor,db,bucket as unknown as MediaR2BucketLike,
    );
    expect(result).toMatchObject({ ok: true, status: 201, state: "QUARANTINED", publicUrl: null });
    if (!result.ok) return;
    const row = await db.prepare("SELECT storage_key,content_sha256 FROM media_r2_quarantine_uploads WHERE id=?")
      .bind(result.id).first<{storage_key:string;content_sha256:string}>();
    expect(row?.storage_key).toMatch(/^quarantine\/v2\/cms-main\//);
    const object = await bucket.get(row!.storage_key);
    expect(object).not.toBeNull();
    expect(object!.httpMetadata?.contentType).toBe("image/png");
    expect(new Uint8Array(await object!.arrayBuffer())).toEqual(tinyPng);
    expect(row?.content_sha256).toMatch(/^[a-f0-9]{64}$/);
    await bucket.delete(row!.storage_key);
  });

  it("enforces two-in-flight actor reservations with a single atomic conditional INSERT", async () => {
    // Seed only synthetic state into disposable D1. Rows never reach hosted R2.
    const ids=[randomUUID(),randomUUID()];
    for(const id of ids) {
      await db.prepare(`INSERT INTO media_r2_quarantine_uploads
        (id,scope_id,actor_user_id,idempotency_key,storage_key,mime_type,
         display_filename,byte_length,state)
        VALUES (?,?,?,?,?,'image/png','qa.png',16,'RESERVED')`)
        .bind(id,MEDIA_STAGING_SCOPE_ID,actor.id,randomUUID(),"quarantine/v2/cms-main/"+id).run();
    }
    const denied=await submitPrivateMediaQuarantine(upload(tinyPng),actor,db,memoryBucket());
    expect(denied).toEqual({ok:false,status:429,code:"MEDIA_QUOTA_OR_RESERVATION_CONFLICT"});
    for(const id of ids) await db.prepare("DELETE FROM media_r2_quarantine_uploads WHERE id=?").bind(id).run();
  });

  it("retries same idempotency and payload without repeating R2 write, conflicts changed content", async () => {
    const bucket=memoryBucket();
    const idem=randomUUID();
    const request=()=>upload(tinyPng,{"idempotency-key":idem});
    const first=await submitPrivateMediaQuarantine(request(),actor,db,bucket);
    const again=await submitPrivateMediaQuarantine(request(),actor,db,bucket);
    expect(first.ok && again.ok).toBe(true);
    if (!first.ok||!again.ok) return;
    expect(first.id).toBe(again.id);
    expect(again.status).toBe(200);
    expect(bucket.objects.size).toBe(1);
    expect(await submitPrivateMediaQuarantine(upload(
      Uint8Array.from([...tinyPng,1]),{"idempotency-key":idem}
    ),actor,db,bucket)).toEqual({ok:false,status:409,code:"IDEMPOTENCY_CONFLICT"});
  });

  it("does not admit viewer, external Origin, wrong MIME or broken magic", async () => {
    const bucket=memoryBucket();
    expect(await submitPrivateMediaQuarantine(upload(tinyPng),viewer,db,bucket))
      .toEqual({ok:false,status:403,code:"ROLE_DENIED"});
    expect(await submitPrivateMediaQuarantine(upload(tinyPng,{origin:"https://attacker.invalid"}),actor,db,bucket))
      .toEqual({ok:false,status:403,code:"ORIGIN_DENIED"});
    expect(await submitPrivateMediaQuarantine(upload(tinyPng,{"content-type":"image/svg+xml"}),actor,db,bucket))
      .toEqual({ok:false,status:415,code:"UNSUPPORTED_MIME"});
    expect(await submitPrivateMediaQuarantine(upload(Uint8Array.from([1,2,3])),actor,db,bucket))
      .toEqual({ok:false,status:415,code:"SIGNATURE_MISMATCH"});
    expect(bucket.objects.size).toBe(0);
  });

  it("enforces byte and chunk counts before any D1/R2 write", async () => {
    const oversized=upload(new Uint8Array(MEDIA_POLICY.file.maxBytes+1));
    expect(await readBoundedMediaRequest(oversized)).toEqual({ok:false,code:"BODY_TOO_LARGE"});
    const many=new Request(origin+"/api/admin/cms/media/quarantine",{
      method:"POST",body:new ReadableStream<Uint8Array>({
        start(controller) {
          for(let i=0;i<5;i++)controller.enqueue(new Uint8Array([i]));
          controller.close();
        },
      }),duplex:"half",
    } as RequestInit & {duplex:"half"});
    expect(await readBoundedMediaRequest(many,100,4,1000))
      .toEqual({ok:false,code:"TOO_MANY_CHUNKS"});
    expect(await readBoundedMediaRequest(upload(new Uint8Array(0))))
      .toEqual({ok:false,code:"EMPTY_BODY"});
  });

  it("purges expired private quarantine with exact D1 CAS state and no public read", async () => {
    const bucket=memoryBucket();
    const result=await submitPrivateMediaQuarantine(upload(tinyPng),actor,db,bucket);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(bucket.objects.size).toBe(1);
    // Aging happens only in random local D1; no real staging data or clock.
    await db.prepare("UPDATE media_r2_quarantine_uploads SET created_at=datetime('now','-8 days') WHERE id=?")
      .bind(result.id).run();
    const cleaned=await cleanupExpiredPrivateMedia(db,bucket);
    expect(cleaned.deleted).toBeGreaterThanOrEqual(1);
    const row=await db.prepare("SELECT state,revision,scanner_attestation FROM media_r2_quarantine_uploads WHERE id=?")
      .bind(result.id).first<{state:string;revision:number;scanner_attestation:string|null}>();
    expect(row?.state).toBe("PURGED");
    expect(row?.revision).toBe(3);
    expect(row?.scanner_attestation).toBeNull();
    expect(bucket.objects.size).toBe(0);
  });

  it("leaves a retryable PURGE_PENDING tombstone when R2 deletion fails", async () => {
    const bucket=memoryBucket({deleteFails:true});
    const result=await submitPrivateMediaQuarantine(upload(tinyPng),actor,db,bucket);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    await db.prepare("UPDATE media_r2_quarantine_uploads SET created_at=datetime('now','-8 days') WHERE id=?")
      .bind(result.id).run();
    const c=await cleanupExpiredPrivateMedia(db,bucket);
    expect(c.failed).toBeGreaterThanOrEqual(1);
    const row=await db.prepare("SELECT state FROM media_r2_quarantine_uploads WHERE id=?")
      .bind(result.id).first<{state:string}>();
    expect(row?.state).toBe("PURGE_PENDING");
    expect(bucket.objects.size).toBe(1);
  });

  it("compensates failed R2 PUT without exposing public URLs or scanning status", async () => {
    const bucket=memoryBucket({putFails:true});
    const result=await submitPrivateMediaQuarantine(upload(tinyPng),actor,db,bucket);
    expect(result).toEqual({ok:false,status:503,code:"QUARANTINE_PERSIST_FAILED"});
    const rows=await db.prepare("SELECT state,scanner_attestation FROM media_r2_quarantine_uploads WHERE state='FAILED'").all();
    expect(rows.results.length).toBeGreaterThan(0);
    expect(bucket.objects.size).toBe(0);
  });
});
