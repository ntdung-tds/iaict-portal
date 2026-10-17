"use client";

import { useEffect,useState } from "react";
import { auditTime,auditMetadata } from '@/lib/cms-audit-display';
import styles from "./revision-history.module.css";
type Revision={id:string;entity_type:string;entity_id:string;actor:string|null;created_at:string;snapshot_json:string;canRestore:boolean;restoreReason?:string|null};
const ENTITY_LABELS:Record<string,string>={pages:"Trang",products:"Sản phẩm",solutions:"Giải pháp",courses:"Khóa học",course_sessions:"Lịch lớp",projects:"Dự án",experts:"Chuyên gia",partners:"Đối tác",events:"Sự kiện",media:"Media",navigation:"Menu",redirects:"Chuyển hướng",articles:"Bài viết",article_categories:"Chuyên mục",users:"Người dùng",leads:"Liên hệ",registrations:"Đăng ký học"};
function entityLabel(value:string){return ENTITY_LABELS[value]??value;}
export function RevisionHistory(){
 const[items,setItems]=useState<Revision[]>([]),[selected,setSelected]=useState<Revision|null>(null),[canAdmin,setCanAdmin]=useState(false);
 const[loading,setLoading]=useState(true),[restoring,setRestoring]=useState(false),[error,setError]=useState<string|null>(null),[message,setMessage]=useState<string|null>(null);
 const[type,setType]=useState(''),[id,setId]=useState(''),[filter,setFilter]=useState({type:'',id:''}),[offset,setOffset]=useState(0),[total,setTotal]=useState(0),[version,setVersion]=useState(0);
 const busy=loading||restoring;
 useEffect(()=>{
  const controller=new AbortController();let active=true;setLoading(true);setError(null);setItems([]);setSelected(null);
  const params=new URLSearchParams({entityType:filter.type,entityId:filter.id,offset:String(offset)});
  fetch(`/api/admin/cms/revisions?${params}`,{cache:'no-store',signal:controller.signal}).then(async response=>{
   const payload=await response.json();if(!response.ok)throw new Error(payload.error||'Không thể tải lịch sử phiên bản.');if(!active)return;
   setCanAdmin(payload.actor?.roles?.includes('admin')??false);setItems(payload.revisions);setTotal(payload.total);setSelected(payload.revisions[0]??null);
  }).catch(cause=>{if(active&&!controller.signal.aborted){setError(cause instanceof Error?cause.message:String(cause));setTotal(0);}}).finally(()=>{if(active)setLoading(false);});
  return()=>{active=false;controller.abort();};
 },[filter,offset,version]);
 async function restore(){
  if(!canAdmin||!selected||!selected.canRestore||busy)return;
  const target=selected;
  if(!window.confirm(`Khôi phục ${entityLabel(target.entity_type)} · ${target.entity_id} về bản lưu lúc ${auditTime(target.created_at)} (UTC+7)? Các trường được hỗ trợ sẽ thay thế dữ liệu hiện tại, có thể gồm trạng thái xuất bản. Dữ liệu hiện tại được lưu thành phiên bản trước khi khôi phục.`))return;
  setRestoring(true);setError(null);setMessage(null);
  try{const response=await fetch('/api/admin/cms/revisions',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({revisionId:target.id})});const payload=await response.json();if(!response.ok)throw new Error(payload.error||'Không thể khôi phục phiên bản.');setMessage(`Đã khôi phục ${entityLabel(target.entity_type)} · ${target.entity_id}.`);setVersion(v=>v+1);}catch(cause){setError(cause instanceof Error?cause.message:String(cause));}finally{setRestoring(false);}
 }
 return <main id="main-content" className={styles.page}>
 <header className={styles.header}><div><span>IAICT CMS / PHIÊN BẢN</span><h1>Lịch sử phiên bản</h1><p>Các bản lưu trước khi sửa hoặc xóa giúp truy vết thay đổi. Thời gian theo giờ Việt Nam (UTC+7). Chỉ Quản trị viên được khôi phục.</p></div><button onClick={()=>{setMessage(null);setVersion(v=>v+1);}} disabled={busy}>Làm mới</button></header>
 <form className={styles.filters} onSubmit={event=>{event.preventDefault();setMessage(null);setOffset(0);setFilter({type,id:id.trim()});}}>
 <label>Loại nội dung<select aria-label="Loại nội dung" aria-describedby="revision-type-help" value={type} disabled={restoring} onChange={event=>setType(event.target.value)}><option value="">Tất cả</option>{Object.entries(ENTITY_LABELS).filter(([key])=>canAdmin||key!=='users').map(([key,label])=><option key={key} value={key}>{label}</option>)}</select><small id="revision-type-help">Chọn module cần tra cứu hoặc xem tất cả nội dung được cấp quyền.</small></label>
 <label>ID bản ghi<input aria-label="ID bản ghi" aria-describedby="revision-id-help" value={id} disabled={restoring} onChange={event=>setId(event.target.value)} placeholder="Để trống để xem tất cả"/><small id="revision-id-help">Nhập chính xác mã bản ghi; không phải tên hay mã phiên bản.</small></label><button disabled={busy} type="submit">Lọc phiên bản</button></form>
 {error?<div className={styles.error} role="alert">{error}</div>:null}{message?<div className={styles.success} role="status">{message}</div>:null}
 <p className={styles.count} aria-live="polite">{loading?'Đang tải phiên bản…':`${total} phiên bản phù hợp · Trang ${offset/40+1}`}</p>
 <section className={styles.workspace} aria-busy={busy}><aside className={styles.list} aria-label="Danh sách phiên bản">{items.map(item=><button disabled={busy} key={item.id} className={selected?.id===item.id?styles.itemActive:styles.item} onClick={()=>{setSelected(item);setError(null);setMessage(null);}}><small>{entityLabel(item.entity_type)}</small><strong>{item.entity_id}</strong><span>{item.actor||'Hệ thống'} · {auditTime(item.created_at)}</span></button>)}{!loading&&items.length===0?<div className={styles.empty}>Không có phiên bản phù hợp.</div>:null}</aside>
 <section className={styles.detail} aria-label="Chi tiết phiên bản">{selected?<><div className={styles.detailHead}><div><span>{entityLabel(selected.entity_type)}</span><strong>Mã bản ghi: {selected.entity_id}</strong><p>{selected.actor||'Hệ thống'} · {auditTime(selected.created_at)} (UTC+7)</p></div>{canAdmin?<button disabled={busy||!selected.canRestore} onClick={()=>void restore()}>{restoring?'Đang khôi phục…':'Khôi phục phiên bản'}</button>:<span>Chỉ xem</span>}</div><p className={styles.guide}>{selected.restoreReason||'Khôi phục thay thế các trường được hỗ trợ bằng bản lưu này, có thể gồm trạng thái xuất bản. Nội dung hiện tại được lưu lại trước khi khôi phục.'}</p><p className={styles.guide}>JSON dưới đây là dữ liệu đã lưu, chỉ xem và sao chép; không cần nhập. Dấu {'{}'} biểu thị đối tượng trống. Các trường chỉ đọc không được khôi phục tự động.</p><pre tabIndex={0} aria-label="Dữ liệu kỹ thuật của phiên bản">{auditMetadata(selected.snapshot_json)}</pre></>:<div className={styles.empty}>Chọn một phiên bản để xem dữ liệu đã lưu.</div>}</section></section>
 <nav className={styles.pagination} aria-label="Phân trang phiên bản"><button disabled={busy||offset===0} onClick={()=>setOffset(v=>Math.max(0,v-40))}>Trang trước</button><span>Trang {offset/40+1}</span><button disabled={busy||offset+40>=total} onClick={()=>setOffset(v=>v+40)}>Trang sau</button></nav>
 </main>;
}
