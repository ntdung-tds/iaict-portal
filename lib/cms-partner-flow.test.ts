import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { DatabaseSync } from 'node:sqlite';
import { readFileSync } from 'node:fs';
import { setDatabaseBinding, type D1BindValue, type D1DatabaseLike, type D1PreparedStatementLike } from './cloudflare-db';
import { saveCmsRecord } from './cms-repository';
import { listPublishedPartners } from './cms-public';
import { getCmsModule } from './cms-schema';
import { prepareCmsData } from './cms-validation';
import type { NewsroomActor } from './newsroom-auth';

let sqlite: DatabaseSync;
let db: D1DatabaseLike;
const actor: NewsroomActor = {id:'qa-user',email:'qa@example.com',displayName:'QA',roles:['admin']};
const base = {name:'Đơn vị A',summary:'Giới thiệu đơn vị',status:'draft',website:'',public_note:'Hợp tác đào tạo'};
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
  const prepared=await prepareCmsData(db,'partners',getCmsModule('partners')!,id,data);
  return saveCmsRecord(db,actor,'partners',id,prepared);
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

it('publishes description and public note together and hides archived partners',async()=>{
 const id=await save(null,base);expect(await listPublishedPartners()).toEqual([]);
 await save(id,{status:'published',website:'https://example.com'});
 expect((await listPublishedPartners())[0]).toMatchObject({summary:'Giới thiệu đơn vị',publicNote:'Hợp tác đào tạo',website:'https://example.com/'});
 await save(id,{status:'archived'});expect(await listPublishedPartners()).toEqual([]);
});
it('attaches and clears a logo without foreign-key errors',async()=>{
 media('logo');const id=await save(null,{...base,status:'published',logo_media_id:'logo'});
 expect((await listPublishedPartners())[0].logoUrl).toBe('https://example.com/photo.jpg');
 await save(id,{logo_media_id:''});expect(sqlite.prepare('SELECT logo_media_id FROM partners WHERE id=?').get(id)?.logo_media_id).toBeNull();
 expect((await listPublishedPartners())[0].logoUrl).toBeNull();
});
it.each([['private','https://example.com/logo.jpg'],['public','http://example.com/logo.jpg']])('rejects logo %s %s',async(visibility,url)=>{
 media('logo',visibility,url);await expect(save(null,{...base,logo_media_id:'logo'})).rejects.toThrow('PARTNER_LOGO');
});
it.each(['http://example.com','javascript:alert(1)','not-a-url'])('rejects invalid website %s',async website=>{
 await expect(save(null,{...base,website})).rejects.toThrow(/INVALID_CMS_FIELD_WEBSITE_/);
});
it('does not expose insecure legacy links or logos in the public directory',async()=>{
 media('logo');const id=await save(null,{...base,status:'published',logo_media_id:'logo'});
 sqlite.prepare('UPDATE partners SET website=? WHERE id=?').run('javascript:alert(1)',id);
 sqlite.exec("UPDATE media SET public_url='http://example.com/logo.jpg' WHERE id='logo'");
 const partner=(await listPublishedPartners())[0];expect(partner.website).toBeNull();expect(partner.logoUrl).toBeNull();
});
