import { afterEach,beforeEach,expect,it,vi } from 'vitest';
import {DatabaseSync} from 'node:sqlite';
import {readFileSync} from 'node:fs';
import {setDatabaseBinding,type D1BindValue,type D1DatabaseLike,type D1PreparedStatementLike} from './cloudflare-db';
import {POST} from '../app/api/admin/news/review/action/route';
vi.mock('./newsroom-auth',async original=>({...await original<typeof import('./newsroom-auth')>(),requireNewsroomActor:vi.fn(async()=>({id:'u',roles:['news_admin']}))}));
let sqlite:DatabaseSync;
let beforeBatch:(()=>void)|null=null;
function adapter(database: DatabaseSync): D1DatabaseLike {
  return {
    prepare(sql:string):D1PreparedStatementLike {
      let params:D1BindValue[]=[];
      const statement:D1PreparedStatementLike={
        bind(...values){params=values;return statement;},
        async first<T>(){return (database.prepare(sql).get(...params as never[])??null) as T|null;},
        async all<T>(){return {results:database.prepare(sql).all(...params as never[]) as T[]};},
        async run(){const result=database.prepare(sql).run(...params as never[]);return {success:true,meta:{changes:result.changes}};},
      };
      return statement;
    },
    async batch(statements){
      if(beforeBatch){const effect=beforeBatch;beforeBatch=null;effect();}
      database.exec('BEGIN');
      try{const results=[];for(const stmt of statements)results.push(await stmt.run());database.exec('COMMIT');return results;}
      catch(error){database.exec('ROLLBACK');throw error;}
    },
  };
}

beforeEach(()=>{
 sqlite=new DatabaseSync(':memory:');for(const name of ['0001_core.sql','0012_v16_news_ingestion_review.sql','0014_v16_news_auto_publish_policy.sql','0017_v16_news_publication_claims.sql'])sqlite.exec(readFileSync('cloudflare/migrations/'+name,'utf8'));
 sqlite.exec(`INSERT INTO admin_users(id,email,created_at,updated_at) VALUES('u','qa@example.com','2026','2026');
 INSERT INTO article_categories(id,name,slug) VALUES('cat','Chuyên mục','cat');
 INSERT INTO news_sources(id,name,homepage_url,entry_url,created_at,updated_at) VALUES('s','Nguồn','https://example.com','https://example.com/rss','2026','2026');
 INSERT INTO news_ingest_items(id,source_id,canonical_url,source_url,title_raw,normalized_title,fetched_at,dedupe_key,created_at,updated_at) VALUES('i','s','https://example.com/news','https://example.com/news','Tiêu đề ban đầu','tieu de','2026','dedupe','2026','2026');
 INSERT INTO news_review_queue(id,ingest_item_id,suggested_title,suggested_excerpt,suggested_category_id,editor_notes,queued_at,updated_at) VALUES('q','i','Tiêu đề ban đầu','Tóm tắt gốc','cat','Ghi chú đã lưu','2026','2026');`);beforeBatch=null;setDatabaseBinding(adapter(sqlite));
});
afterEach(()=>{beforeBatch=null;delete (globalThis as {__IAICT_D1_DB__?:D1DatabaseLike}).__IAICT_D1_DB__;sqlite.close();});
const post=(body:unknown)=>POST(new Request('https://example.com',{method:'POST',body:JSON.stringify(body)}));
it('clears excerpt and category while preserving omitted notes',async()=>{const r=await post({action:'edit',queueId:'q',expectedUpdatedAt:'2026',excerpt:null,categoryId:null});expect(r.status).toBe(200);const row=sqlite.prepare('SELECT * FROM news_review_queue').get();expect(row?.edited_excerpt).toBe('');expect(row?.suggested_category_id).toBeNull();expect(row?.editor_notes).toBe('Ghi chú đã lưu');expect(row?.workflow_status).toBe('editing');});
it('invalid category rejects before changing content',async()=>{const r=await post({action:'edit',queueId:'q',expectedUpdatedAt:'2026',title:'Tiêu đề đã thay đổi',categoryId:'missing'});expect(r.status).toBe(400);expect(sqlite.prepare('SELECT edited_title FROM news_review_queue').get()?.edited_title).toBeNull();});
it('editing approved content requires approval again',async()=>{sqlite.exec("UPDATE news_review_queue SET workflow_status='approved',reviewed_by='u',reviewed_at='2026'");expect((await post({action:'edit',queueId:'q',expectedUpdatedAt:'2026',title:'Tiêu đề đã thay đổi'})).status).toBe(200);const row=sqlite.prepare('SELECT * FROM news_review_queue').get();expect(row?.workflow_status).toBe('editing');expect(row?.reviewed_by).toBeNull();});
it.each(['published','rejected'])('does not edit %s content',async status=>{sqlite.prepare('UPDATE news_review_queue SET workflow_status=?').run(status);expect((await post({action:'edit',queueId:'q',expectedUpdatedAt:'2026',title:'Tiêu đề đã thay đổi'})).status).toBe(400);});
it.each([null,[],{action:'edit',queueId:'q',expectedUpdatedAt:'2026',title:42},{action:'edit',queueId:'q',expectedUpdatedAt:'2026',excerpt:{}},{action:'reject',queueId:'q',expectedUpdatedAt:'2026',reason:'  '}])('rejects malformed request %j',async body=>{expect((await post(body)).status).toBe(400);expect(sqlite.prepare('SELECT COUNT(*) n FROM audit_logs').get()?.n).toBe(0);});
it('stores a rejection reason without publishing',async()=>{expect((await post({action:'reject',queueId:'q',expectedUpdatedAt:'2026',reason:'  Nội dung chưa phù hợp  '})).status).toBe(200);const row=sqlite.prepare('SELECT * FROM news_review_queue').get();expect(row?.workflow_status).toBe('rejected');expect(row?.review_reason).toBe('Nội dung chưa phù hợp');expect(row?.article_id).toBeNull();});
it('rejects pending publication',async()=>{expect((await post({action:'publish',queueId:'q',expectedUpdatedAt:'2026'})).status).toBe(409);});


it('rejects review edits from a stale client without creating an audit',async()=>{
 const response=await post({action:'edit',queueId:'q',expectedUpdatedAt:'2025',title:'Tiêu đề sai phiên bản'});
 expect(response.status).toBe(409);
 expect(sqlite.prepare("SELECT edited_title FROM news_review_queue WHERE id='q'").get()?.edited_title).toBeNull();
 expect(sqlite.prepare("SELECT COUNT(*) AS n FROM audit_logs").get()?.n).toBe(0);
});
it('rolls back edit and audit when another actor changes status just before batch',async()=>{
 beforeBatch=()=>sqlite.exec("UPDATE news_review_queue SET workflow_status='published',updated_at='2026-10-31' WHERE id='q'");
 const response=await post({action:'edit',queueId:'q',expectedUpdatedAt:'2026',title:'Ghi đè không hợp lệ'});
 expect(response.status).toBe(409);
 const row=sqlite.prepare("SELECT workflow_status,edited_title FROM news_review_queue WHERE id='q'").get();
 expect(row?.workflow_status).toBe('published');expect(row?.edited_title).toBeNull();
 expect(sqlite.prepare("SELECT COUNT(*) AS n FROM audit_logs").get()?.n).toBe(0);
});
it('rolls back approval when a concurrent editor changes the queue item before batch',async()=>{
 beforeBatch=()=>sqlite.exec("UPDATE news_review_queue SET edited_title='Đã sửa ở nơi khác',updated_at='2026-10-31' WHERE id='q'");
 const response=await post({action:'approve',queueId:'q',expectedUpdatedAt:'2026'});
 expect(response.status).toBe(409);
 const row=sqlite.prepare("SELECT workflow_status,edited_title FROM news_review_queue WHERE id='q'").get();
 expect(row?.workflow_status).toBe('pending');expect(row?.edited_title).toBe('Đã sửa ở nơi khác');
 expect(sqlite.prepare("SELECT COUNT(*) AS n FROM audit_logs").get()?.n).toBe(0);
});
it('keeps the entire review mutation atomic when audit insertion fails',async()=>{
 sqlite.exec("CREATE TRIGGER deny_review_audit BEFORE INSERT ON audit_logs BEGIN SELECT RAISE(ABORT,'forced review audit failure'); END");
 const response=await post({action:'approve',queueId:'q',expectedUpdatedAt:'2026'});
 expect(response.status).toBe(500);
 expect(sqlite.prepare("SELECT workflow_status FROM news_review_queue WHERE id='q'").get()?.workflow_status).toBe('pending');
 expect(sqlite.prepare("SELECT COUNT(*) AS n FROM audit_logs").get()?.n).toBe(0);
});
it('rejects manual publication if the approved review changed after precheck',async()=>{
 sqlite.exec("UPDATE news_review_queue SET workflow_status='approved',updated_at='2026' WHERE id='q'");
 beforeBatch=()=>sqlite.exec("UPDATE news_review_queue SET edited_title='Phiên bản duyệt mới',updated_at='2026-10-31' WHERE id='q'");
 const response=await post({action:'publish',queueId:'q',expectedUpdatedAt:'2026'});
 expect(response.status).toBe(409);
 expect(sqlite.prepare("SELECT COUNT(*) AS n FROM articles").get()?.n).toBe(0);
 expect(sqlite.prepare("SELECT COUNT(*) AS n FROM article_provenance").get()?.n).toBe(0);
 expect(sqlite.prepare("SELECT COUNT(*) AS n FROM audit_logs").get()?.n).toBe(0);
});
