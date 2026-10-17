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
const base = {title:'Giám sát môi trường',slug:'giam-sat-moi-truong',summary:'Mô hình IoT thí điểm.',status:'draft',scope_json:'[]',technologies_json:'[]',results_json:'[]',seo_json:'{}'};
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
  const prepared=await prepareCmsData(db,'projects',getCmsModule('projects')!,id,data);
  return saveCmsRecord(db,actor,'projects',id,prepared);
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

describe('Project persistence and public visibility',()=>{
 it('publishes all project sections then hides archived records',async()=>{
  const id=await save(null,base);expect(await getPublishedEntity('project',base.slug)).toBeNull();
  await save(id,{status:'published',context:'Bối cảnh',solution:'Giải pháp',scope_json:'["Quan trắc"]',technologies_json:'["IoT"]',results_json:'["Đã hoàn tất thử nghiệm"]',replication_potential:'Nhân rộng theo điều kiện'});
  const item=await getPublishedEntity('project',base.slug);
  expect(item?.sections).toHaveLength(6);
  expect(item?.sections.find(section=>section.label==='Kết quả')?.value).toEqual(['Đã hoàn tất thử nghiệm']);
  expect((await listPublishedEntities('project')).map(item=>item.id)).toEqual([id]);
  await save(id,{status:'archived'});expect(await getPublishedEntity('project',base.slug)).toBeNull();expect(await listPublishedEntities('project')).toEqual([]);
 });
 it('prioritizes featured published records and excludes drafts',async()=>{
  await save(null,{...base,status:'published'});
  const featured=await save(null,{...base,slug:'noi-bat',status:'published',featured:true});
  await save(null,{...base,slug:'nhap',featured:true});
  const list=await listPublishedEntities('project');expect(list).toHaveLength(2);expect(list[0].id).toBe(featured);
 });
 it.each([
  {slug:'tram-rung'},
  {title:'Trâm Rừng',slug:''},
  {slug:'sai/duong-dan'},
  {seo_json:'[]'},
  {seo_json:'{"title":123}'},
  {scope_json:'{"name":"không phải danh sách"}'},
  {technologies_json:'[123]'},
  {results_json:'[""]'},
 ])('rejects invalid project fields %j without creating a record',async patch=>{
  await expect(save(null,{...base,...patch})).rejects.toThrow(/INVALID_CMS_PROJECT_/);
  expect(sqlite.prepare('SELECT COUNT(*) AS count FROM projects').get()?.count).toBe(0);
 });
 it('generates a URL from the title when slug is blank',async()=>{
  const id=await save(null,{...base,slug:''});
  expect(sqlite.prepare('SELECT slug FROM projects WHERE id=?').get(id)?.slug).toBe('giam-sat-moi-truong');
 });
});
