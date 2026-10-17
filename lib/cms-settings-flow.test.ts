import { getPublicSiteSettings } from './public-site-settings';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { DatabaseSync } from 'node:sqlite';
import { readFileSync } from 'node:fs';
import { setDatabaseBinding, type D1BindValue, type D1DatabaseLike, type D1PreparedStatementLike } from './cloudflare-db';
import { GET, POST } from '../app/api/admin/cms/settings/route';
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

beforeEach(()=>{
 sqlite=new DatabaseSync(':memory:');sqlite.exec(readFileSync('cloudflare/migrations/0001_core.sql','utf8'));sqlite.exec(readFileSync('cloudflare/migrations/0019_v17_full_cms.sql','utf8'));
 sqlite.exec("INSERT INTO admin_users(id,email,created_at,updated_at) VALUES('qa-user','qa@example.com','2026-10-17','2026-10-17')");setDatabaseBinding(adapter(sqlite));
});
afterEach(()=>{delete (globalThis as {__IAICT_D1_DB__?:D1DatabaseLike}).__IAICT_D1_DB__;sqlite.close();});
function save(settings:unknown,organizationName='Viện kiểm thử'){return POST(new Request('https://example.com/api/admin/cms/settings',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({organizationName,settings})}));}
it('preserves additional settings and records revisions while updating public defaults',async()=>{
 sqlite.prepare("UPDATE site_settings SET settings_json=? WHERE id='default'").run(JSON.stringify({extra:{keep:true},contactPhone:'123'}));
 expect((await save({siteTitle:' Tên mới ',siteDescription:'Mô tả mới',defaultSeoTitle:'',defaultSeoDescription:'',contactEmail:'qa@example.com',socialLinks:{facebook:'https://example.com/social'}})).status).toBe(200);
 const data=await (await GET(new Request('https://example.com/api/admin/cms/settings'))).json();expect(data.settings.extra).toEqual({keep:true});expect(data.settings.contactPhone).toBe('123');
 const publicSettings=await getPublicSiteSettings();expect(publicSettings.defaultSeoTitle).toBe('Tên mới');expect(publicSettings.defaultSeoDescription).toBe('Mô tả mới');expect(publicSettings.contactEmail).toBe('qa@example.com');expect(publicSettings.socialLinks.facebook).toBe('https://example.com/social');
 expect(sqlite.prepare("SELECT COUNT(*) AS count FROM cms_revisions WHERE entity_type='site_settings'").get()?.count).toBe(1);
 expect((await save({contactEmail:'',socialLinks:{}})).status).toBe(200);expect((await getPublicSiteSettings()).socialLinks).toEqual({});expect((await getPublicSiteSettings()).contactEmail).toBe('');
});
it.each([null,[],{contactEmail:'bad'},{siteTitle:123},{socialLinks:[]},{socialLinks:{facebook:12}},{socialLinks:{facebook:'http://example.com'}},{socialLinks:{facebook:'https://user:pass@example.com'}}])('rejects malformed settings %j',async settings=>{expect((await save(settings)).status).toBe(400);});
it('requires admin to save and does not expose data after denied access',async()=>{
 const {requireNewsroomActor,NewsroomAuthError}=await import('./newsroom-auth');vi.mocked(requireNewsroomActor).mockRejectedValueOnce(new NewsroomAuthError(403,'Forbidden'));expect((await save({})).status).toBe(403);expect(vi.mocked(requireNewsroomActor).mock.calls.at(-1)?.[2]).toEqual(['admin']);
});
it('omits unsafe legacy social links from public settings',async()=>{
 sqlite.prepare("UPDATE site_settings SET settings_json=? WHERE id='default'").run(JSON.stringify({socialLinks:{bad:'javascript:alert(1)',valid:'https://example.com'}}));expect((await getPublicSiteSettings()).socialLinks).toEqual({valid:'https://example.com'});
});
