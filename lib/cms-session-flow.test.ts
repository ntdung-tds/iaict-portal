import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { DatabaseSync } from 'node:sqlite';
import { readFileSync } from 'node:fs';
import { setDatabaseBinding, type D1BindValue, type D1DatabaseLike, type D1PreparedStatementLike } from './cloudflare-db';
import { POST } from '../app/api/admin/cms/course-sessions/route';
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

beforeEach(() => {
  sqlite=new DatabaseSync(':memory:');
  sqlite.exec(readFileSync('cloudflare/migrations/0001_core.sql','utf8'));
  sqlite.exec(readFileSync('cloudflare/migrations/0019_v17_full_cms.sql','utf8'));
  sqlite.exec("INSERT INTO admin_users(id,email,created_at,updated_at) VALUES('qa-user','qa@example.com','2026-10-16','2026-10-16')");
  sqlite.exec("INSERT INTO courses(id,title,slug,summary,status,created_at,updated_at) VALUES('c1','Course','course','Summary','published','2026-10-16','2026-10-16')");
  setDatabaseBinding(adapter(sqlite));
});
afterEach(() => { delete (globalThis as {__IAICT_D1_DB__?:D1DatabaseLike}).__IAICT_D1_DB__; sqlite.close(); });
function save(data: Record<string,unknown>, id?:string) { return POST(new Request('https://example.com/api/admin/cms/course-sessions',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({id,data:{course_id:'c1',status:'draft',...data}})})); }
it('persists Vietnam time as UTC and returns the saved record for immediate selection',async () => {
  const response=await save({start_at:'2026-10-16T09:00',capacity:''});
  expect(response.status).toBe(200);
  const payload=await response.json();
  expect(payload.record.start_at).toBe('2026-10-16T02:00:00.000Z');
  expect(payload.record.course_title).toBe('Course');
  expect(payload.record.capacity).toBeNull();
  const updated=await save({start_at:payload.record.start_at,location:'New location'},payload.id);
  expect(updated.status).toBe(200);
  expect((await updated.json()).record.start_at).toBe(payload.record.start_at);
  expect(sqlite.prepare('SELECT COUNT(*) AS count FROM cms_revisions').get()?.count).toBe(1);
});
it.each([
  {start_at:'2026-02-30T09:00'},
  {start_at:'2026-10-16T09:00',end_at:'2026-10-16T08:00'},
  {registration_open_at:'2026-10-16T09:00',registration_close_at:'2026-10-16T08:00'},
  {capacity:1.5},
  {online_url_private:'http://example.com'},
])('rejects invalid session input without writing: %j',async data => {
  const response=await save(data);expect(response.status).toBe(400);
  expect(sqlite.prepare('SELECT COUNT(*) AS count FROM course_sessions').get()?.count).toBe(0);
});
