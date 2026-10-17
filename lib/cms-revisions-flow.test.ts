import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { DatabaseSync } from 'node:sqlite';
import { readFileSync } from 'node:fs';
import { setDatabaseBinding, type D1BindValue, type D1DatabaseLike, type D1PreparedStatementLike } from './cloudflare-db';
import { GET, POST } from '../app/api/admin/cms/revisions/route';
vi.mock('./newsroom-auth', async importOriginal => ({ ...await importOriginal<typeof import('./newsroom-auth')>(), requireNewsroomActor: vi.fn(async () => ({id:'qa-user',roles:['admin']})) }));
let sqlite: DatabaseSync;
function adapter(database: DatabaseSync): D1DatabaseLike {
  return {
    prepare(sql:string):D1PreparedStatementLike {
      let params:D1BindValue[]=[];
      const statement:D1PreparedStatementLike={
        bind(...values){params=values;return statement;},
        async first<T>(){return (database.prepare(sql).get(...params as never[])??null) as T|null;},
        async all<T>(){return {results:database.prepare(sql).all(...params as never[]) as T[]};},
        async run(){database.prepare(sql).run(...params as never[]);return {success:true};},
      };
      return statement;
    },
    async batch(statements){return Promise.all(statements.map(statement=>statement.run()));},
  };
}

const snapshot={title:'Tiêu đề cũ',slug:'trang-test',body:'Nội dung cũ',status:'draft',page_type:'standard',layout_json:'{}',seo_json:'{}'};
function revision(id:string,type='pages',entity='p1',raw=JSON.stringify(snapshot)){
 sqlite.prepare("INSERT INTO cms_revisions(id,entity_type,entity_id,actor_user_id,snapshot_json,created_at) VALUES(?,?,?,'qa-user',?,'2026-10-17T02:00:00Z')").run(id,type,entity,raw);
}
function restore(id:string){return POST(new Request('https://example.com/api/admin/cms/revisions',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({revisionId:id})}));}
beforeEach(()=>{
 sqlite=new DatabaseSync(':memory:');sqlite.exec(readFileSync('cloudflare/migrations/0001_core.sql','utf8'));sqlite.exec(readFileSync('cloudflare/migrations/0019_v17_full_cms.sql','utf8'));
 sqlite.exec("INSERT INTO admin_users(id,email,created_at,updated_at) VALUES('qa-user','qa@example.com','2026-10-17','2026-10-17')");
 sqlite.exec("INSERT INTO pages(id,title,slug,status,created_at,updated_at) VALUES('p1','Hiện tại','trang-test','draft','2026-10-17','2026-10-17')");
 setDatabaseBinding(adapter(sqlite));
});
afterEach(()=>{delete (globalThis as {__IAICT_D1_DB__?:D1DatabaseLike}).__IAICT_D1_DB__;sqlite.close();});
it('restores editable fields and preserves current state as a new revision',async()=>{
 revision('r1');expect((await restore('r1')).status).toBe(200);
 expect(sqlite.prepare("SELECT title FROM pages WHERE id='p1'").get()?.title).toBe('Tiêu đề cũ');
 const prior=sqlite.prepare("SELECT snapshot_json FROM cms_revisions WHERE id!='r1'").get();expect(JSON.parse(String(prior?.snapshot_json)).title).toBe('Hiện tại');
 expect(sqlite.prepare("SELECT COUNT(*) AS count FROM audit_logs WHERE action='cms.revision.restore'").get()?.count).toBe(1);
});
it.each(['null','[]','{}','broken'])('rejects malformed or empty snapshots %s before saving',async raw=>{
 revision('bad','pages','p1',raw);expect((await restore('bad')).status).toBe(400);expect(sqlite.prepare('SELECT COUNT(*) AS count FROM cms_revisions').get()?.count).toBe(1);
});
it('marks deleted and unsupported entities as view-only and rejects restoration',async()=>{
 revision('deleted','pages','gone');revision('users','users','qa-user');
 const data=await (await GET(new Request('https://example.com/api/admin/cms/revisions'))).json();expect(data.revisions.every((r:{canRestore:boolean})=>!r.canRestore)).toBe(true);expect((await restore('deleted')).status).toBe(400);expect((await restore('users')).status).toBe(400);
});
it('filters and paginates beyond 120 revisions',async()=>{
 for(let i=0;i<125;i++)revision(String(i).padStart(3,'0'));
 const first=await (await GET(new Request('https://example.com/api/admin/cms/revisions?entityType=pages&entityId=p1'))).json();const last=await (await GET(new Request('https://example.com/api/admin/cms/revisions?offset=120'))).json();expect(first.total).toBe(125);expect(first.revisions).toHaveLength(40);expect(last.revisions).toHaveLength(5);expect(first.revisions[0].canRestore).toBe(true);
});
it('excludes user snapshots and their counts for non-admins',async()=>{
 revision('public');revision('private','users','qa-user');
 const {requireNewsroomActor}=await import('./newsroom-auth');vi.mocked(requireNewsroomActor).mockResolvedValueOnce({id:'qa-user',email:'qa@example.com',displayName:'QA',roles:['viewer']});
 const data=await (await GET(new Request('https://example.com/api/admin/cms/revisions'))).json();expect(data.total).toBe(1);expect(data.revisions[0].id).toBe('public');
});
it('requires admin for restore and returns authorization errors',async()=>{
 const {requireNewsroomActor,NewsroomAuthError}=await import('./newsroom-auth');vi.mocked(requireNewsroomActor).mockRejectedValueOnce(new NewsroomAuthError(403,'Forbidden'));
 expect((await restore('r1')).status).toBe(403);expect(vi.mocked(requireNewsroomActor).mock.calls.at(-1)?.[2]).toEqual(['admin']);
});
