import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { DatabaseSync } from 'node:sqlite';
import { readFileSync } from 'node:fs';
import { setDatabaseBinding, type D1BindValue, type D1DatabaseLike, type D1PreparedStatementLike } from './cloudflare-db';
import { GET, POST, DELETE } from '../app/api/admin/cms/collection/route';
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

beforeEach(()=>{
 sqlite=new DatabaseSync(':memory:');sqlite.exec(readFileSync('cloudflare/migrations/0001_core.sql','utf8'));sqlite.exec(readFileSync('cloudflare/migrations/0019_v17_full_cms.sql','utf8'));
 sqlite.exec("INSERT INTO admin_users(id,email,display_name,created_at,updated_at) VALUES('qa-user','qa@example.com','QA Admin','2026-10-16','2026-10-16')");
 for(let i=0;i<85;i++)sqlite.prepare("INSERT INTO audit_logs(id,actor_user_id,action,entity_type,entity_id,metadata_json,created_at) VALUES(?,'qa-user','cms.entity.update','pages',?,'{}','2026-10-16T02:00:00Z')").run(String(i).padStart(3,'0'),'p'+i);
 setDatabaseBinding(adapter(sqlite));
});
afterEach(()=>{delete (globalThis as {__IAICT_D1_DB__?:D1DatabaseLike}).__IAICT_D1_DB__;sqlite.close();});
it('paginates deterministically beyond 80 logs and counts filtered results',async()=>{
 const read=async(offset:number,q='')=>(await GET(new Request('https://example.com/api/admin/cms/collection?module=audit&limit=40&offset='+offset+'&q='+encodeURIComponent(q)))).json();
 const first=await read(0),second=await read(40),last=await read(80);
 expect(first.total).toBe(85);expect(first.items).toHaveLength(40);expect(second.items).toHaveLength(40);expect(last.items).toHaveLength(5);expect(new Set([...first.items,...second.items,...last.items].map(i=>i.id)).size).toBe(85);
 expect(first.items[0].actor_name).toBe('QA Admin');expect((await read(0,'qa@example.com')).total).toBe(85);expect((await read(0,'QA Admin')).total).toBe(85);expect((await read(0,'not-found')).total).toBe(0);expect((await read(0,'%')).total).toBe(0);
});
it('shows system actors and unknown user IDs without losing rows',async()=>{
 sqlite.exec("UPDATE audit_logs SET actor_user_id=NULL WHERE id='084'");
 const response=await GET(new Request('https://example.com/api/admin/cms/collection?module=audit'));expect(response.headers.get('Cache-Control')).toBe('no-store');const data=await response.json();expect(data.items[0].actor_name).toBe('Hệ thống');
});
it('requires admin role and blocks audit mutations',async()=>{
 const {requireNewsroomActor}=await import('./newsroom-auth');
 await GET(new Request('https://example.com/api/admin/cms/collection?module=audit'));expect(vi.mocked(requireNewsroomActor).mock.calls.at(-1)?.[2]).toEqual(['admin']);
 for(const [method,handler] of [['POST',POST],['DELETE',DELETE]] as const){const response=await handler(new Request('https://example.com/api/admin/cms/collection',{method,headers:{'Content-Type':'application/json'},body:JSON.stringify({module:'audit',id:'084',data:{action:'tampered'}})}));expect(response.status).toBe(400);}
 expect(sqlite.prepare('SELECT COUNT(*) AS count FROM audit_logs').get()?.count).toBe(85);
});
it('returns no log data when authorization is denied',async()=>{
 const {requireNewsroomActor,NewsroomAuthError}=await import('./newsroom-auth');
 vi.mocked(requireNewsroomActor).mockRejectedValueOnce(new NewsroomAuthError(403,'Forbidden'));
 const response=await GET(new Request('https://example.com/api/admin/cms/collection?module=audit'));
 expect(response.status).toBe(403);expect(await response.json()).not.toHaveProperty('items');
});
