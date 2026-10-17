import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { DatabaseSync } from 'node:sqlite';
import { readFileSync } from 'node:fs';
import { setDatabaseBinding, type D1BindValue, type D1DatabaseLike, type D1PreparedStatementLike } from './cloudflare-db';
import { getPublicNavigation, saveCmsRecord } from './cms-repository';
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
  const prepared=await prepareCmsData(db,'navigation',getCmsModule('navigation')!,id,data);
  return saveCmsRecord(db,actor,'navigation',id,prepared);
}
beforeEach(()=>{
  sqlite=new DatabaseSync(':memory:');
  sqlite.exec(readFileSync('cloudflare/migrations/0001_core.sql','utf8'));
  sqlite.exec(readFileSync('cloudflare/migrations/0019_v17_full_cms.sql','utf8'));
  sqlite.prepare('INSERT INTO admin_users(id,email,created_at,updated_at) VALUES(?,?,?,?)').run(actor.id,actor.email,'2026-10-16','2026-10-16');
  sqlite.exec('DELETE FROM navigation_items');db=adapter(sqlite);setDatabaseBinding(db);
});
afterEach(()=>{
  delete (globalThis as {__IAICT_D1_DB__?:D1DatabaseLike}).__IAICT_D1_DB__;
  sqlite.close();
});
describe('Navigation persistence and public output',()=>{
 const item={label:'Dự án',href:'/du-an',group_name:'main',sort_order:2,is_active:true,opens_new_tab:false};
 it('keeps order, tab choice and hides inactive or other groups',async()=>{
  const id=await save(null,item);
  await save(null,{...item,label:'Ngoài',href:'https://example.com',sort_order:1,opens_new_tab:true});
  await save(null,{...item,label:'Ẩn',is_active:false});
  await save(null,{...item,label:'Footer',group_name:'footer'});
  expect(await getPublicNavigation(db)).toEqual([{label:'Ngoài',href:'https://example.com',opensNewTab:true},{label:'Dự án',href:'/du-an',opensNewTab:false}]);
  await save(id,{is_active:false});expect((await getPublicNavigation(db)).length).toBe(1);
 });
 it('normalizes blank order and returns an empty menu when disabled',async()=>{
  const id=await save(null,{...item,sort_order:''});
  expect(sqlite.prepare('SELECT sort_order FROM navigation_items WHERE id=?').get(id)?.sort_order).toBe(0);
  await save(id,{is_active:false});expect(await getPublicNavigation(db)).toEqual([]);
 });
 it.each(['//evil.example','javascript:alert(1)','http://example.com','/bad path','https://user:pass@example.com','/\\evil.example'])('rejects unsafe href %s',async href=>{
  await expect(save(null,{...item,href})).rejects.toThrow('NAVIGATION_HREF');
 });
 it.each([-1,1.5])('rejects invalid sort order %s',async sort_order=>{await expect(save(null,{...item,sort_order})).rejects.toThrow('NAVIGATION_SORT_ORDER');});
 it('filters unsafe legacy links',async()=>{
  const id=await save(null,item);sqlite.prepare('UPDATE navigation_items SET href=? WHERE id=?').run('javascript:alert(1)',id);expect(await getPublicNavigation(db)).toEqual([]);
 });
});
