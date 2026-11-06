import {afterAll,beforeAll,describe,expect,it} from "vitest";
import {readFile} from "node:fs/promises";
import {randomUUID} from "node:crypto";
import {Miniflare,convertV4MiniflareOptions} from "miniflare";
import type {D1DatabaseLike} from "./cloudflare-db";
import type {NewsroomActor} from "./newsroom-auth";
import {listPrivateMedia,revokePrivateMedia} from "./media-r2-library";

describe("private Media inventory and audited revoke [DISPOSABLE D1 ONLY]",()=>{
 let mf:Miniflare,db:D1DatabaseLike;
 const admin:NewsroomActor={id:"qa-admin-media",email:"admin@example.test",displayName:null,roles:["admin"]};
 const editor:NewsroomActor={id:"qa-editor-media",email:"editor@example.test",displayName:null,roles:["editor"]};
 const reviewer:NewsroomActor={id:"qa-reviewer-media",email:"reviewer@example.test",displayName:null,roles:["reviewer"]};
 const viewer:NewsroomActor={id:"qa-viewer-media",email:"viewer@example.test",displayName:null,roles:["viewer"]};
 const newsroom:NewsroomActor={id:"qa-news-media",email:"news@example.test",displayName:null,roles:["news_admin"]};
 const keys:{admin:string;editor:string}={admin:"",editor:""};
 async function add(actor:NewsroomActor,name:string,state="QUARANTINED"){
   const id=randomUUID();const key="quarantine/v2/cms-main/"+id;
   await db.prepare(`INSERT INTO media_r2_quarantine_uploads
     (id,scope_id,actor_user_id,idempotency_key,storage_key,mime_type,display_filename,
      byte_length,content_sha256,state,revision)
     VALUES(?,'cms-main',?,?,?,'image/png',?,69,? ,?,1)`)
     .bind(id,actor.id,randomUUID(),key,name,"a".repeat(64),state).run();
   return id;
 }
 beforeAll(async()=>{
   mf=new Miniflare(convertV4MiniflareOptions({
     modules:true,script:"export default {fetch(){return new Response('synthetic')}}",
     compatibilityDate:"2026-10-12",compatibilityFlags:["nodejs_compat"],
     d1Databases:{DB:randomUUID()},
   }));
   db=await mf.getD1Database("DB") as unknown as D1DatabaseLike;
   for(const name of ["0001_core.sql","0025_media_r2_quarantine.sql","0026_media_r2_scan_evidence.sql"]){
     const sql=await readFile(new URL("../cloudflare/migrations/"+name,import.meta.url),"utf8");
     for(const statement of sql.split(/;\s*(?:\r?\n|$)/).map(x=>x.trim())
       .filter(x=>x.split(/\r?\n/).some(line=>line.trim()&&!line.trim().startsWith("--"))))
       await db.prepare(statement).run();
   }
   for(const a of [admin,editor,reviewer,viewer,newsroom]){
     await db.prepare("INSERT INTO admin_users(id,email,is_active,created_at,updated_at) VALUES(?,?,1,'qa','qa')")
       .bind(a.id,a.email).run();
   }
   keys.admin=await add(admin,"admin-private.png");
   keys.editor=await add(editor,"editor-private.png");
 },60_000);
 afterAll(async()=>{if(mf)await mf.dispose()});

 it("shows metadata to CMS admin/reviewer and only own files to editor",async()=>{
   const a=await listPrivateMedia(db,admin),r=await listPrivateMedia(db,reviewer);
   const e=await listPrivateMedia(db,editor);
   expect(a.ok&&r.ok&&e.ok).toBe(true);
   if(!a.ok||!r.ok||!e.ok)return;
   expect(a.items.some(x=>x.id===keys.admin)).toBe(true);
   expect(a.items.some(x=>x.id===keys.editor)).toBe(true);
   expect(r.items.length).toBe(a.items.length);
   expect(e.items.map(x=>x.id)).toEqual([keys.editor]);
   expect(e.items[0].canRevoke).toBe(false);
   expect(a.items.every(x=>x.publicUrl===null)).toBe(true);
   expect(JSON.stringify(a)).not.toContain("quarantine/v2/");
   expect(JSON.stringify(a)).not.toContain('"storage_key"');
   expect(JSON.stringify(a)).not.toContain('"content_sha256"');
   expect(JSON.stringify(a)).not.toContain('"idempotency_key"');
 });
 it("blocks viewer and newsroom-only roles from unscanned metadata",async()=>{
   expect(await listPrivateMedia(db,viewer)).toEqual({ok:false,status:403,code:"ROLE_DENIED"});
   expect(await listPrivateMedia(db,newsroom)).toEqual({ok:false,status:403,code:"ROLE_DENIED"});
 });
 it("rejects unbounded pagination",async()=>{
   expect(await listPrivateMedia(db,admin,"0")).toEqual({ok:false,status:400,code:"INVALID_PAGE"});
   expect(await listPrivateMedia(db,admin,"101")).toEqual({ok:false,status:400,code:"INVALID_PAGE"});
   expect(await listPrivateMedia(db,admin,"1;DELETE FROM admin_users")).toEqual({ok:false,status:400,code:"INVALID_PAGE"});
 });
 it("denies unauthorized revoke and malformed version without touching row",async()=>{
   expect(await revokePrivateMedia(db,editor,keys.admin,1)).toEqual({ok:false,status:403,code:"ROLE_DENIED"});
   expect(await revokePrivateMedia(db,reviewer,keys.editor,1)).toEqual({ok:false,status:403,code:"ROLE_DENIED"});
   expect(await revokePrivateMedia(db,admin,"invalid",1)).toEqual({ok:false,status:400,code:"INVALID_REVOKE_REQUEST"});
   expect(await revokePrivateMedia(db,admin,keys.admin,0)).toEqual({ok:false,status:400,code:"INVALID_REVOKE_REQUEST"});
   const row=await db.prepare("SELECT state,revision FROM media_r2_quarantine_uploads WHERE id=?")
     .bind(keys.admin).first<{state:string;revision:number}>();
   expect(row).toEqual({state:"QUARANTINED",revision:1});
 });
 it("revokes with one CAS and audit, blocks replay and stale revisions",async()=>{
   const result=await revokePrivateMedia(db,admin,keys.admin,1);
   expect(result).toEqual({ok:true,status:200,id:keys.admin,state:"REVOKED",publicUrl:null});
   const row=await db.prepare("SELECT state,revision,storage_key FROM media_r2_quarantine_uploads WHERE id=?")
     .bind(keys.admin).first<{state:string;revision:number;storage_key:string}>();
   expect(row?.state).toBe("REVOKED");expect(row?.revision).toBe(2);
   expect(row?.storage_key).toBe("quarantine/v2/cms-main/"+keys.admin);
   const audits=await db.prepare("SELECT action,actor_user_id FROM audit_logs WHERE entity_id=? AND action='media.quarantine.revoked'")
     .bind(keys.admin).all<{action:string;actor_user_id:string}>();
   expect(audits.results).toHaveLength(1);
   expect(audits.results[0].actor_user_id).toBe(admin.id);
   expect(await revokePrivateMedia(db,admin,keys.admin,1))
     .toEqual({ok:false,status:409,code:"MEDIA_STATE_CONFLICT"});
   expect(await revokePrivateMedia(db,admin,keys.admin,2))
     .toEqual({ok:false,status:409,code:"MEDIA_STATE_CONFLICT"});
   const count=await db.prepare("SELECT COUNT(*) AS n FROM audit_logs WHERE entity_id=? AND action='media.quarantine.revoked'")
     .bind(keys.admin).first<{n:number}>();
   expect(count?.n).toBe(1);
 });
 it("uses a bounded page of at most 20 assets and hasNext",async()=>{
   const scope=await listPrivateMedia(db,admin,1);
   expect(scope.ok).toBe(true);
   if(scope.ok){expect(scope.pageSize).toBe(20);expect(scope.items.length).toBeLessThanOrEqual(20);}
 });
});
