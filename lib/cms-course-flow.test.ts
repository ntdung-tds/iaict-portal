import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { DatabaseSync } from 'node:sqlite';
import { readFileSync } from 'node:fs';
import { setDatabaseBinding, type D1BindValue, type D1DatabaseLike, type D1PreparedStatementLike } from './cloudflare-db';
import { saveCmsRecord } from './cms-repository';
import { getPublishedEntity, listPublishedEntities } from './cms-public';
import { getCmsModule } from './cms-schema';
import { prepareCmsData } from './cms-validation';
import type { NewsroomActor } from './newsroom-auth';

let sqlite: DatabaseSync;
let db: D1DatabaseLike;
const actor: NewsroomActor = {id:'qa-user',email:'qa@example.com',displayName:'QA',roles:['admin']};
const base = {title:'Khóa AI cơ bản',slug:'khoa-ai-co-ban',summary:'Thực hành AI.',status:'draft',code:'',materials_json:'["Giáo trình học viên"]',seo_json:'{}'};
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
  const prepared=await prepareCmsData(db,'courses',getCmsModule('courses')!,id,data);
  return saveCmsRecord(db,actor,'courses',id,prepared);
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
describe('Course persistence and public flow with real SQLite constraints',()=>{
  it('allows multiple courses without a code and enforces explicit code uniqueness',async()=>{
    await save(null,base);
    const second=await save(null,{...base,title:'Khóa AI nâng cao',slug:'khoa-ai-nang-cao',code:'   '});
    expect(sqlite.prepare('SELECT COUNT(*) AS count FROM courses WHERE code IS NULL').get()?.count).toBe(2);
    await save(second,{code:' AI-02 '});
    await expect(save(null,{...base,slug:'khoa-thu-ba',code:'AI-02'})).rejects.toThrow(/UNIQUE constraint failed: courses.code/);
    await save(second,{code:''});
    expect(sqlite.prepare('SELECT code FROM courses WHERE id=?').get(second)?.code).toBeNull();
  });
  it('publishes course materials and hides archived content immediately',async()=>{
    const id=await save(null,base);
    expect(await getPublishedEntity('course',base.slug)).toBeNull();
    expect(await listPublishedEntities('course')).toEqual([]);
    await save(id,{status:'published',materials_json:'["Giáo trình học viên","https://example.com/guide.pdf"]'});
    const published=await getPublishedEntity('course',base.slug);
    expect(published?.sections.find(section=>section.label==='Tài liệu')?.value).toEqual(['Giáo trình học viên','https://example.com/guide.pdf']);
    expect((await listPublishedEntities('course')).map(item=>item.id)).toEqual([id]);
    await save(id,{status:'archived'});
    expect(await getPublishedEntity('course',base.slug)).toBeNull();
    expect(await listPublishedEntities('course')).toEqual([]);
    expect(sqlite.prepare('SELECT COUNT(*) AS count FROM cms_revisions WHERE entity_id=?').get(id)?.count).toBe(2);
  });
  it('lists featured published courses first and excludes drafts',async()=>{
    await save(null,{...base,slug:'thuong',status:'published'});
    const featured=await save(null,{...base,slug:'noi-bat',status:'published',featured:true});
    await save(null,{...base,slug:'nhap',featured:true});
    const items=await listPublishedEntities('course');
    expect(items.length).toBe(2);expect(items[0].id).toBe(featured);
  });
});
