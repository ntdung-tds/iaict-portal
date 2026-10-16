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

beforeEach(() => {
  sqlite=new DatabaseSync(':memory:');
  sqlite.exec(readFileSync('cloudflare/migrations/0001_core.sql','utf8'));
  sqlite.exec(readFileSync('cloudflare/migrations/0019_v17_full_cms.sql','utf8'));
  sqlite.exec("INSERT INTO admin_users(id,email,created_at,updated_at) VALUES('qa-user','qa@example.com','2026-10-16','2026-10-16')");
  sqlite.exec("INSERT INTO courses(id,title,slug,summary,status,created_at,updated_at) VALUES('c1','Course','course','Summary','published','2026-10-16','2026-10-16')");
  sqlite.exec("INSERT INTO leads(id,type,source_url,contact_name,consent_at,created_at,updated_at) VALUES('l1','course','/dao-tao-tap-huan','Học viên A','2026-10-16','2026-10-16','2026-10-16')");
  sqlite.exec("INSERT INTO course_sessions(id,course_id,start_at,created_at,updated_at) VALUES('s1','c1','2026-10-16T02:00:00Z','2026-10-16','2026-10-16')");
  sqlite.exec("INSERT INTO course_registrations(id,course_id,session_id,contact_name,lead_id,consent_at,created_at,updated_at) VALUES('r1','c1','s1','Học viên A','l1','2026-10-16','2026-10-16','2026-10-16')");
  setDatabaseBinding(adapter(sqlite));
});
afterEach(() => { delete (globalThis as {__IAICT_D1_DB__?:D1DatabaseLike}).__IAICT_D1_DB__; sqlite.close(); });

function request(method: string, data: Record<string,unknown>, id: string|null = 'r1') { return new Request('https://example.com/api/admin/cms/collection',{method,headers:{'Content-Type':'application/json'},body:JSON.stringify({module:'registrations',id,data})}); }
it('updates only status, preserves original contact/course data and records a revision',async()=>{
  const response=await POST(request('POST',{status:'confirmed',contact_name:'Tampered',course_id:'wrong',session_id:'wrong'}));
  expect(response.status).toBe(200);
  const {record}=await response.json();
  expect(record.status).toBe('confirmed'); expect(record.contact_name).toBe('Học viên A');
  expect(record.course_id).toBe('c1');expect(record.session_id).toBe('s1');
  expect(sqlite.prepare('SELECT COUNT(*) AS count FROM cms_revisions').get()?.count).toBe(1);
});
it.each(['', 'published', 'invalid'])('rejects unsupported status %s before writing',async status=>{
  const response=await POST(request('POST',{status}));expect(response.status).toBe(400);
  expect(sqlite.prepare("SELECT status FROM course_registrations WHERE id='r1'").get()?.status).toBe('submitted');
  expect(sqlite.prepare('SELECT COUNT(*) AS count FROM cms_revisions').get()?.count).toBe(0);
});
it('prevents manual creation and deletion',async()=>{
  expect((await POST(request('POST',{status:'submitted'},null))).status).toBe(400);
  expect((await DELETE(request('DELETE',{}))).status).toBe(400);
  expect(sqlite.prepare('SELECT COUNT(*) AS count FROM course_registrations').get()?.count).toBe(1);
});
it('filters by status and resolves original session even beyond 200 newer sessions',async()=>{
  for(let i=0;i<205;i++) sqlite.prepare("INSERT INTO course_sessions(id,course_id,start_at,created_at,updated_at) VALUES(?,'c1','2027-01-01T02:00:00Z','2026-10-16','2026-10-16')").run(`new-${i}`);
  const payload=await (await GET(new Request('https://example.com/api/admin/cms/collection?module=registrations&status=submitted'))).json();
  expect(payload.items).toHaveLength(1);
  expect(payload.references.sessions).toHaveLength(1);
  expect(payload.references.sessions[0].value).toBe('s1');
  expect(payload.references.sessions[0].label).toContain('09:00');
  expect(payload.references.sessions[0].label).not.toContain('02:00');
  const empty=await (await GET(new Request('https://example.com/api/admin/cms/collection?module=registrations&status=cancelled'))).json();
  expect(empty.total).toBe(0);
});
