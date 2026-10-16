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
  sqlite.exec("INSERT INTO admin_users(id,email,display_name,is_active,created_at,updated_at) VALUES('inactive','old@example.com','Người cũ',0,'2026-10-16','2026-10-16')");
  setDatabaseBinding(adapter(sqlite));
});
afterEach(() => { delete (globalThis as {__IAICT_D1_DB__?:D1DatabaseLike}).__IAICT_D1_DB__; sqlite.close(); });


function request(method:string,data:Record<string,unknown>,id:string|null='l1'){return new Request('https://example.com/api/admin/cms/collection',{method,headers:{'Content-Type':'application/json'},body:JSON.stringify({module:'leads',id,data})});}
it('assigns, clears assignment and preserves original contact data',async()=>{
  let response=await POST(request('POST',{owner_id:'qa-user',status:'contacted',internal_notes:'Đã gọi',contact_name:'Không được sửa'}));
  expect(response.status).toBe(200);let record=(await response.json()).record;
  expect(record.owner_id).toBe('qa-user');expect(record.contact_name).toBe('Học viên A');
  response=await POST(request('POST',{owner_id:'',status:'qualified',internal_notes:'Chờ phân công'}));
  expect(response.status).toBe(200);record=(await response.json()).record;
  expect(record.owner_id).toBeNull();expect(record.internal_notes).toBe('Chờ phân công');
  expect(sqlite.prepare('SELECT COUNT(*) AS count FROM cms_revisions').get()?.count).toBe(2);
});
it('allows notes updates for an existing inactive assignee but blocks new inactive assignments',async()=>{
  expect((await POST(request('POST',{owner_id:'inactive',status:'new'}))).status).toBe(400);
  sqlite.exec("UPDATE leads SET owner_id='inactive' WHERE id='l1'");
  const response=await POST(request('POST',{owner_id:'inactive',status:'contacted',internal_notes:'Chờ người mới tiếp nhận'}));
  expect(response.status).toBe(200);expect((await response.json()).record.owner_id).toBe('inactive');
  const payload=await (await GET(new Request('https://example.com/api/admin/cms/collection?module=leads'))).json();
  expect(payload.references.users.find((u:{value:string})=>u.value==='inactive')).toMatchObject({disabled:true,label:'Người cũ · Đã ngừng hoạt động'});
  expect((await POST(request('POST',{owner_id:'',status:'contacted'}))).status).toBe(200);
});
it.each([{status:''},{status:'published'},{owner_id:'missing'}])('rejects invalid updates %j',async data=>{
  expect((await POST(request('POST',data))).status).toBe(400);
  expect(sqlite.prepare("SELECT status FROM leads WHERE id='l1'").get()?.status).toBe('new');
});
it('does not allow manual creation or deletion of an intake request',async()=>{
  expect((await POST(request('POST',{status:'new'},null))).status).toBe(400);
  expect((await DELETE(request('DELETE',{}))).status).toBe(400);
  expect(sqlite.prepare('SELECT COUNT(*) AS count FROM leads').get()?.count).toBe(1);
});
