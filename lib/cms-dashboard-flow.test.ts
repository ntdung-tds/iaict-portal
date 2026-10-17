import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { DatabaseSync } from 'node:sqlite';
import { readFileSync } from 'node:fs';
import { setDatabaseBinding, type D1BindValue, type D1DatabaseLike, type D1PreparedStatementLike } from './cloudflare-db';
import { GET } from '../app/api/admin/cms/overview/route';
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
 sqlite.exec("INSERT INTO admin_users(id,email,created_at,updated_at) VALUES('qa-user','qa@example.com','2026-10-17','2026-10-17')");
 sqlite.exec("INSERT INTO audit_logs(id,actor_user_id,action,entity_type,entity_id,metadata_json,created_at) VALUES('a1','qa-user','cms.user.update','users','private-user','{}','2026-10-17T02:00:00Z')");
 sqlite.exec("INSERT INTO pages(id,title,slug,status,created_at,updated_at) VALUES('p1','Page','page','published','2026-10-17','2026-10-17'),('p2','Draft','draft','draft','2026-10-17','2026-10-17')");
 setDatabaseBinding(adapter(sqlite));
});
afterEach(()=>{delete (globalThis as {__IAICT_D1_DB__?:D1DatabaseLike}).__IAICT_D1_DB__;sqlite.close();});
it('counts all records separately from published content and returns no-store',async()=>{
 const response=await GET(new Request('https://example.com/api/admin/cms/overview'));expect(response.status).toBe(200);expect(response.headers.get('Cache-Control')).toBe('no-store');const data=await response.json();expect(data.counts.pages).toBe(2);expect(data.publishedCount).toBe(1);expect(data.counts.articles).toBe(0);expect(data.counts.courseSessions).toBe(0);expect(data.recentActivity[0].id).toBe('a1');
});
it('does not expose administrative activity to content viewers',async()=>{
 const {requireNewsroomActor}=await import('./newsroom-auth');vi.mocked(requireNewsroomActor).mockResolvedValueOnce({id:'qa-user',email:'qa@example.com',displayName:'QA',roles:['viewer']});const data=await (await GET(new Request('https://example.com/api/admin/cms/overview'))).json();expect(data.recentActivity).toEqual([]);expect(data.counts.pages).toBe(2);
});
it('marks unavailable newsroom counts instead of reporting zero',async()=>{
 const data=await (await GET(new Request('https://example.com/api/admin/cms/overview'))).json();expect(data.counts.newsQueue).toBeNull();
});
it('reports load failures without fabricated totals',async()=>{
 sqlite.exec('DROP TABLE pages');const response=await GET(new Request('https://example.com/api/admin/cms/overview'));expect(response.status).toBe(500);expect(await response.json()).not.toHaveProperty('counts');
});
