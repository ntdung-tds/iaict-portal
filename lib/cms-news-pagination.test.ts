import { afterEach,beforeEach,expect,it,vi } from 'vitest';
import {DatabaseSync} from 'node:sqlite';
import {readFileSync} from 'node:fs';
import {setDatabaseBinding,type D1BindValue,type D1DatabaseLike,type D1PreparedStatementLike} from './cloudflare-db';
import {GET} from '../app/api/admin/news/review/route';
vi.mock('./newsroom-auth',async original=>({...await original<typeof import('./newsroom-auth')>(),requireNewsroomActor:vi.fn(async()=>({id:'u',roles:['news_admin']}))}));
let sqlite:DatabaseSync;
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
 sqlite=new DatabaseSync(':memory:');for(const name of ['0001_core.sql','0012_v16_news_ingestion_review.sql','0014_v16_news_auto_publish_policy.sql'])sqlite.exec(readFileSync('cloudflare/migrations/'+name,'utf8'));
 sqlite.exec(`INSERT INTO admin_users(id,email,created_at,updated_at) VALUES('u','qa@example.com','2026','2026');
 INSERT INTO article_categories(id,name,slug) VALUES('cat','Chuyên mục','cat');
 INSERT INTO news_sources(id,name,homepage_url,entry_url,created_at,updated_at) VALUES('s','Nguồn','https://example.com','https://example.com/rss','2026','2026');
 INSERT INTO news_ingest_items(id,source_id,canonical_url,source_url,title_raw,normalized_title,fetched_at,dedupe_key,created_at,updated_at) VALUES('i','s','https://example.com/news','https://example.com/news','Tiêu đề ban đầu','tieu de','2026','dedupe','2026','2026');
 INSERT INTO news_review_queue(id,ingest_item_id,suggested_title,suggested_excerpt,suggested_category_id,editor_notes,queued_at,updated_at) VALUES('q','i','Tiêu đề ban đầu','Tóm tắt gốc','cat','Ghi chú đã lưu','2026','2026');`);setDatabaseBinding(adapter(sqlite));
});
afterEach(()=>{delete (globalThis as {__IAICT_D1_DB__?:D1DatabaseLike}).__IAICT_D1_DB__;sqlite.close();});

const get=(query='')=>GET(new Request('https://example.com/api/admin/news/review?'+query));
function addRows(){for(let i=0;i<64;i++){const id=String(i).padStart(3,'0');sqlite.prepare("INSERT INTO news_ingest_items(id,source_id,canonical_url,source_url,title_raw,normalized_title,fetched_at,dedupe_key,created_at,updated_at) VALUES(?,'s','https://example.com/news','https://example.com/news','Tiêu đề','tieu de','2026',?,'2026','2026')").run('i'+id,'key'+id);sqlite.prepare("INSERT INTO news_review_queue(id,ingest_item_id,suggested_title,queued_at,updated_at) VALUES(?,?,'Tiêu đề','2026','2026')").run('q'+id,'i'+id);}}
it('paginates tied timestamps deterministically without overlap',async()=>{addRows();const first=await get('limit=60');expect(first.status).toBe(200);expect(first.headers.get('Cache-Control')).toBe('no-store');const a=await first.json();const b=await (await get('limit=60&offset=60')).json();expect(a.total).toBe(65);expect(a.items).toHaveLength(60);expect(b.items).toHaveLength(5);expect(new Set([...a.items,...b.items].map(x=>x.queue_id)).size).toBe(65);expect((await(await get('limit=60')).json()).items.map((x:any)=>x.queue_id)).toEqual(a.items.map((x:any)=>x.queue_id));});
it('counts only the selected status and clamps an out-of-range page',async()=>{addRows();sqlite.exec("UPDATE news_review_queue SET workflow_status='approved' WHERE id='q'");const data=await(await get('status=approved&limit=60&offset=600')).json();expect(data.total).toBe(1);expect(data.offset).toBe(0);expect(data.items[0].queue_id).toBe('q');});
it('returns an empty first page for an empty status',async()=>{const data=await(await get('status=rejected&offset=60')).json();expect(data.total).toBe(0);expect(data.offset).toBe(0);expect(data.items).toEqual([]);});
it.each(['limit=0','limit=101','limit=1.5','limit=NaN','offset=-1','offset=1.5','offset=Infinity','status=missing'])('rejects invalid pagination %s',async query=>{expect((await get(query)).status).toBe(400);});
