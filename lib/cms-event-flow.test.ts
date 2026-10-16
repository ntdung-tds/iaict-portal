import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { DatabaseSync } from 'node:sqlite';
import { readFileSync } from 'node:fs';
import { setDatabaseBinding, type D1BindValue, type D1DatabaseLike, type D1PreparedStatementLike } from './cloudflare-db';
import { saveCmsRecord } from './cms-repository';
import { getPublishedEvent, listPublishedEvents } from './cms-public';
import { getCmsModule } from './cms-schema';
import { prepareCmsData } from './cms-validation';
import type { NewsroomActor } from './newsroom-auth';

let sqlite: DatabaseSync;
let db: D1DatabaseLike;
const actor: NewsroomActor = {id:'qa-user',email:'qa@example.com',displayName:'QA',roles:['admin']};
const base = {title:'Hội thảo AI',slug:'hoi-thao-ai',summary:'Trao đổi ứng dụng AI',status:'draft',start_at:'2026-10-20T09:00',end_at:'2026-10-20T11:00',seo_json:'{}'};
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
async function save(id:string|null,data:Record<string,unknown>){
  const prepared=await prepareCmsData(db,'events',getCmsModule('events')!,id,data);
  return saveCmsRecord(db,actor,'events',id,prepared);
}
beforeEach(()=>{
  sqlite=new DatabaseSync(':memory:');
  sqlite.exec(readFileSync('cloudflare/migrations/0001_core.sql','utf8'));
  sqlite.exec(readFileSync('cloudflare/migrations/0019_v17_full_cms.sql','utf8'));
  sqlite.prepare('INSERT INTO admin_users(id,email,created_at,updated_at) VALUES(?,?,?,?)').run(actor.id,actor.email,'2026-10-16','2026-10-16');
  db=adapter(sqlite);setDatabaseBinding(db);
});
afterEach(()=>{
  delete (globalThis as {__IAICT_D1_DB__?:D1DatabaseLike}).__IAICT_D1_DB__;
  sqlite.close();
});


it('stores Vietnam times as UTC, publishes the local schedule and hides archived events',async()=>{
 const id=await save(null,base);expect(await getPublishedEvent(base.slug)).toBeNull();
 expect(sqlite.prepare('SELECT start_at FROM events WHERE id=?').get(id)?.start_at).toBe('2026-10-20T02:00:00.000Z');
 await save(id,{status:'published',registration_url:'https://example.com/register'});
 const event=await getPublishedEvent(base.slug);
 expect(event?.sections[0].value).toMatchObject({'Bắt đầu':expect.stringContaining('09:00'),'Kết thúc':expect.stringContaining('11:00'),'Đăng ký':'https://example.com/register'});
 expect((await listPublishedEvents()).map(item=>item.id)).toEqual([id]);
 await save(id,{status:'archived'});expect(await getPublishedEvent(base.slug)).toBeNull();expect(await listPublishedEvents()).toEqual([]);
});
it('compares mixed offset and local inputs as the same timezone',async()=>{
 await expect(save(null,{...base,start_at:'2026-10-20T02:00:00Z',end_at:'2026-10-20T08:30'})).rejects.toThrow('EVENT_END_BEFORE_START');
});
it('allows clearing dates without silently restoring an old schedule',async()=>{
 const id=await save(null,base);await save(id,{start_at:'',end_at:''});
 expect(sqlite.prepare('SELECT start_at,end_at FROM events WHERE id=?').get(id)).toMatchObject({start_at:null,end_at:null});
});
it.each([
 {start_at:'2026-02-30T09:00'}, {end_at:'2026-10-19T09:00'},
 {registration_url:'http://example.com'}, {registration_url:'javascript:alert(1)'},
 {seo_json:'[]'}, {seo_json:'{"title":123}'}, {slug:'invalid/path'},
])('rejects invalid event data %j',async patch=>{await expect(save(null,{...base,...patch})).rejects.toThrow(/INVALID_CMS_/);});
