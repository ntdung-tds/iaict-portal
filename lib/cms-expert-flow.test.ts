import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { DatabaseSync } from 'node:sqlite';
import { readFileSync } from 'node:fs';
import { setDatabaseBinding, type D1BindValue, type D1DatabaseLike, type D1PreparedStatementLike } from './cloudflare-db';
import { saveCmsRecord } from './cms-repository';
import { getPublishedExpert, listPublishedExperts } from './cms-public';
import { getCmsModule } from './cms-schema';
import { prepareCmsData } from './cms-validation';
import type { NewsroomActor } from './newsroom-auth';

let sqlite: DatabaseSync;
let db: D1DatabaseLike;
const actor: NewsroomActor = {id:'qa-user',email:'qa@example.com',displayName:'QA',roles:['admin']};
const base = {name:'Nguyễn Văn A',slug:'nguyen-van-a',title:'Chuyên gia AI',bio:'Kinh nghiệm triển khai',status:'draft',expertise_json:'["AI"]',public_contacts_json:'{}',seo_json:'{}'};
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
  const prepared=await prepareCmsData(db,'experts',getCmsModule('experts')!,id,data);
  return saveCmsRecord(db,actor,'experts',id,prepared);
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

function media(id:string,visibility='public',url='https://example.com/photo.jpg'){
 sqlite.prepare('INSERT INTO media(id,type,storage_key,visibility,public_url,created_at,updated_at) VALUES(?,?,?,?,?,?,?)').run(id,'image',id,visibility,url,'2026-10-16','2026-10-16');
}
it('publishes an expert profile and removes it from public views when archived',async()=>{
 const id=await save(null,base);expect(await getPublishedExpert(base.slug)).toBeNull();
 await save(id,{status:'published',public_contacts_json:'{"email":"expert@example.com","website":"https://example.com"}'});
 expect((await listPublishedExperts()).map(item=>item.id)).toEqual([id]);
 expect((await getPublishedExpert(base.slug))?.sections.find(s=>s.label==='Thông tin công khai')?.value).toMatchObject({email:'expert@example.com'});
 await save(id,{status:'archived'});expect(await getPublishedExpert(base.slug)).toBeNull();expect(await listPublishedExperts()).toEqual([]);
});
it('attaches and clears a public HTTPS photo without foreign-key errors',async()=>{
 media('photo');const id=await save(null,{...base,status:'published',photo_media_id:'photo'});
 expect((await getPublishedExpert(base.slug))?.heroUrl).toBe('https://example.com/photo.jpg');
 await save(id,{photo_media_id:''});expect(sqlite.prepare('SELECT photo_media_id FROM experts WHERE id=?').get(id)?.photo_media_id).toBeNull();
 expect((await getPublishedExpert(base.slug))?.heroUrl).toBeNull();
});
it.each([['private','https://example.com/photo.jpg'],['public','http://example.com/photo.jpg']])('rejects photo with visibility %s and URL %s',async(visibility,url)=>{
 media('photo',visibility,url);await expect(save(null,{...base,photo_media_id:'photo'})).rejects.toThrow('EXPERT_PHOTO');
});
it.each([
 {expertise_json:'{}'}, {expertise_json:'[123]'}, {public_contacts_json:'[]'},
 {public_contacts_json:'{"email":"wrong"}'}, {public_contacts_json:'{"website":"http://example.com"}'},
 {public_contacts_json:'{"phone":{"number":"123"}}'}, {seo_json:'[]'}, {seo_json:'{"title":12}'}, {slug:'wrong/path'},
])('rejects malformed expert content %j',async patch=>{await expect(save(null,{...base,...patch})).rejects.toThrow(/INVALID_CMS_EXPERT_/);});
it('generates the slug from the name',async()=>{
 const id=await save(null,{...base,slug:''});expect(sqlite.prepare('SELECT slug FROM experts WHERE id=?').get(id)?.slug).toBe('nguyen-van-a');
});
