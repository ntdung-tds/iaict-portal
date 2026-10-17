"use client";

import { useEffect, useState } from 'react';
import { AUDIT_ACTION_LABELS, auditMetadata, auditTime } from '@/lib/cms-audit-display';
import { getCmsModule } from '@/lib/cms-schema';
import styles from './audit-log-viewer.module.css';

type Row={id:string;action:string;entity_type:string;entity_id:string|null;actor_user_id:string|null;actor_name:string;created_at:string;metadata_json:string};
const pageSize=40;
function entityName(value:string){return getCmsModule(value)?.label??({navigation_items:'Menu điều hướng',articles:'Bài viết',article_categories:'Chuyên mục'} as Record<string,string>)[value]??value;}
export function AuditLogViewer(){
 const [query,setQuery]=useState('');
 const [filter,setFilter]=useState('');
 const [offset,setOffset]=useState(0);
 const [version,setVersion]=useState(0);
 const [rows,setRows]=useState<Row[]>([]);
 const [total,setTotal]=useState(0);
 const [selected,setSelected]=useState<string|null>(null);
 const [busy,setBusy]=useState(true);
 const [error,setError]=useState('');
 useEffect(()=>{
  const controller=new AbortController();let active=true;
  setBusy(true);setError('');setRows([]);setSelected(null);
  const params=new URLSearchParams({module:'audit',q:filter,limit:String(pageSize),offset:String(offset)});
  fetch(`/api/admin/cms/collection?${params}`,{signal:controller.signal,cache:'no-store'}).then(async response=>{
   const data=await response.json();
   if(!response.ok)throw new Error(response.status===403?'Chỉ Quản trị viên được xem nhật ký hệ thống.':data.error??'Không tải được nhật ký.');
   if(!active)return;
   setRows(data.items);setTotal(data.total);setSelected(data.items[0]?.id??null);
  }).catch(cause=>{if(active&&!controller.signal.aborted){setError(cause instanceof Error?cause.message:'Không tải được nhật ký.');setTotal(0);}}).finally(()=>{if(active)setBusy(false);});
  return()=>{active=false;controller.abort();};
 },[filter,offset,version]);
 const current=rows.find(row=>row.id===selected);
 return <main id="main-content" className={styles.page}>
  <header><span className={styles.eyebrow}>IAICT CMS · Giám sát</span><h1>Nhật ký hệ thống</h1><p>Tra cứu thao tác quản trị. Dữ liệu chỉ đọc; thời gian hiển thị theo giờ Việt Nam (UTC+7).</p></header>
  <form className={styles.toolbar} onSubmit={event=>{event.preventDefault();setOffset(0);setFilter(query.trim());setVersion(v=>v+1);}}>
   <label htmlFor="audit-search">Tìm kiếm<input id="audit-search" value={query} onChange={event=>setQuery(event.target.value)} aria-describedby="audit-search-help" placeholder="Tên, email, mã hành động hoặc đối tượng…"/><small id="audit-search-help">Tìm theo tên/email người thực hiện, mã hành động (ví dụ cms.entity.update), loại/ID đối tượng hoặc nội dung chi tiết.</small></label>
   <button type="submit" disabled={busy}>Tìm kiếm</button><button type="button" disabled={busy} onClick={()=>setVersion(v=>v+1)}>Làm mới</button>
  </form>
  {error?<div role="alert" className={styles.error}>{error} <button type="button" onClick={()=>setVersion(v=>v+1)}>Thử lại</button></div>:null}
  <p role="status">{busy?'Đang tải nhật ký…':error?'':total?`Hiển thị ${rows.length?offset+1:0}–${offset+rows.length} / ${total} bản ghi`:'Không có nhật ký phù hợp.'}</p>
  <div className={styles.workspace} aria-busy={busy}>
   <section aria-label="Danh sách nhật ký" className={styles.list}>
    {rows.map(row=><button type="button" key={row.id} onClick={()=>setSelected(row.id)} aria-pressed={selected===row.id}>
     <time dateTime={row.created_at}>{auditTime(row.created_at)}</time><strong>{AUDIT_ACTION_LABELS[row.action]??row.action}</strong><span>{row.actor_name} · {entityName(row.entity_type)}</span>
    </button>)}
   </section>
   <section aria-label="Chi tiết nhật ký" className={styles.detail}>
    {current?<><h2>{AUDIT_ACTION_LABELS[current.action]??current.action}</h2><dl>
     <dt>Người thực hiện</dt><dd>{current.actor_name}</dd>
     <dt>Mã người dùng</dt><dd>{current.actor_user_id||'Không có — tác vụ hệ thống'}</dd>
     <dt>Thời điểm (UTC+7)</dt><dd>{auditTime(current.created_at)}</dd>
     <dt>Mã hành động</dt><dd>{current.action}</dd>
     <dt>Loại đối tượng</dt><dd>{entityName(current.entity_type)}</dd>
     <dt>ID đối tượng</dt><dd>{current.entity_id||'Không có'}</dd>
     <dt>ID nhật ký</dt><dd>{current.id}</dd>
    </dl><h3>Thông tin chi tiết (JSON)</h3><p>Dữ liệu hệ thống ghi nhận kèm thao tác, có thể chọn và sao chép. Dấu {'{}'} nghĩa là không có thông tin bổ sung; nhật ký không nhất thiết chứa toàn bộ nội dung trước và sau thay đổi.</p><pre tabIndex={0} aria-label="Dữ liệu chi tiết JSON">{auditMetadata(current.metadata_json)}</pre></>:<p>{busy?'Đang tải chi tiết…':'Chọn một bản ghi để xem chi tiết.'}</p>}
   </section>
  </div>
  <nav className={styles.pagination} aria-label="Phân trang nhật ký"><button disabled={busy||offset===0} onClick={()=>setOffset(value=>Math.max(0,value-pageSize))}>Trang trước</button><span>Trang {Math.floor(offset/pageSize)+1}</span><button disabled={busy||offset+pageSize>=total} onClick={()=>setOffset(value=>value+pageSize)}>Trang sau</button></nav>
 </main>;
}
