import { clearPublicRedirectCache, resolvePublicRedirect } from './public-redirects';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { DatabaseSync } from 'node:sqlite';
import { readFileSync } from 'node:fs';
import { setDatabaseBinding, type D1BindValue, type D1DatabaseLike, type D1PreparedStatementLike } from './cloudflare-db';
import { saveCmsRecord } from './cms-repository';
import { getCmsModule } from './cms-schema';
import { prepareCmsData } from './cms-validation';
import type { NewsroomActor } from './newsroom-auth';

let sqlite: DatabaseSync;
let db: D1DatabaseLike;
const actor: NewsroomActor = {id:'qa-user',email:'qa@example.com',displayName:'QA',roles:['admin']};
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
  const prepared=await prepareCmsData(db,'redirects',getCmsModule('redirects')!,id,data);
  return saveCmsRecord(db,actor,'redirects',id,prepared);
}
beforeEach(()=>{
  sqlite=new DatabaseSync(':memory:');
  sqlite.exec(readFileSync('cloudflare/migrations/0001_core.sql','utf8'));
  sqlite.exec(readFileSync('cloudflare/migrations/0019_v17_full_cms.sql','utf8'));
  sqlite.prepare('INSERT INTO admin_users(id,email,created_at,updated_at) VALUES(?,?,?,?)').run(actor.id,actor.email,'2026-10-16','2026-10-16');
  sqlite.exec('DELETE FROM redirects');clearPublicRedirectCache();db=adapter(sqlite);setDatabaseBinding(db);
});
afterEach(()=>{
  delete (globalThis as {__IAICT_D1_DB__?:D1DatabaseLike}).__IAICT_D1_DB__;
  sqlite.close();
});
describe('Redirect editor and Worker resolution',()=>{
 const item={source_path:'/cu',destination_path:'/moi',status_code:'302',is_active:true};
 const request=(path='/cu?a=1',method='GET')=>new Request('https://example.com'+path,{method});
 it('persists and resolves a redirect, retains query, and can disable it',async()=>{
  const id=await save(null,item);let result=await resolvePublicRedirect(request(),db);
  expect(result?.status).toBe(302);expect(result?.headers.get('location')).toBe('https://example.com/moi?a=1');
  await save(id,{is_active:false});clearPublicRedirectCache();expect(await resolvePublicRedirect(request(),db)).toBeNull();
 });
 it.each(['//evil.example','/admin','/api/test','/cu?q=1','/cu#x','/a/../cu'])('rejects invalid source %s',async source_path=>{await expect(save(null,{...item,source_path})).rejects.toThrow('REDIRECT_SOURCE_PATH');});
 it.each(['javascript:alert(1)','//evil.example','http://example.com','/bad path'])('rejects invalid destination %s',async destination_path=>{await expect(save(null,{...item,destination_path})).rejects.toThrow('REDIRECT_DESTINATION_PATH');});
 it('rejects normalized self loops and multi-rule loops',async()=>{
  await expect(save(null,{...item,destination_path:'/x/../cu#part'})).rejects.toThrow('REDIRECT_LOOP');
  await save(null,item);await expect(save(null,{...item,source_path:'/moi',destination_path:'/cu'})).rejects.toThrow('REDIRECT_LOOP');
 });
 it('safely ignores legacy same-origin absolute cycles',async()=>{
  await save(null,{...item,destination_path:'https://example.com/cu'});expect(await resolvePublicRedirect(request(),db)).toBeNull();
 });
 it('detects cycles even if written outside CMS',async()=>{
  await save(null,item);const id=await save(null,{...item,source_path:'/moi',destination_path:'/end'});
  sqlite.prepare('UPDATE redirects SET destination_path=? WHERE id=?').run('/cu',id);
  expect(await resolvePublicRedirect(request(),db)).toBeNull();
  await save(id,{is_active:false});clearPublicRedirectCache();expect((await resolvePublicRedirect(request(),db))?.status).toBe(302);
 });
 it('resolves .html paths, HEAD, explicit target query and all supported codes',async()=>{
  for(const status_code of ['301','302','307','308']){
   const source_path='/old-'+status_code+'.html';await save(null,{...item,source_path,status_code,destination_path:'/moi?b=2#part'});
   const response=await resolvePublicRedirect(request(source_path+'?a=1','HEAD'),db);
   expect(response?.status).toBe(Number(status_code));expect(response?.headers.get('location')).toBe('https://example.com/moi?b=2#part');
  }
 });
 it('skips protected routes and POST',async()=>{
  await save(null,item);expect(await resolvePublicRedirect(request('/cu','POST'),db)).toBeNull();expect(await resolvePublicRedirect(request('/api/test'),db)).toBeNull();
 });
 it('keeps ordinary redirect chains usable',async()=>{
  await save(null,item);await save(null,{...item,source_path:'/moi',destination_path:'/end'});
  expect((await resolvePublicRedirect(request(),db))?.headers.get('location')).toBe('https://example.com/moi?a=1');
 });
 it('fails open on database errors and bad legacy destinations',async()=>{
  const id=await save(null,item);sqlite.prepare('UPDATE redirects SET destination_path=? WHERE id=?').run('javascript:alert(1)',id);
  expect(await resolvePublicRedirect(request(),db)).toBeNull();clearPublicRedirectCache();sqlite.exec('DROP TABLE redirects');expect(await resolvePublicRedirect(request(),db)).toBeNull();
 });
});
