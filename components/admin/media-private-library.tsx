"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import styles from "./media-private-library.module.css";

type Item = {
  id:string; filename:string; mimeType:string; bytes:number; state:string;
  revision:number; createdAt:string; updatedAt:string;
  scanPrivate:boolean; canRevoke:boolean; publicUrl:null;
};
type Inventory =
  | {ok:true;items:Item[];page:number;pageSize:number;hasNext:boolean;publicAccess:false}
  | {ok:false;code:string};
const descriptions:Record<string,string>={
  QUARANTINED:"Đang cách ly · Chưa được xuất bản",
  REVOKED:"Đã thu hồi · Chờ dọn dữ liệu theo hạn lưu",
  PURGE_PENDING:"Đang dọn dữ liệu riêng tư",
  PURGED:"Đã dọn tệp · Giữ bản ghi kiểm toán",
  RESERVED:"Đang tiếp nhận tệp",
  FAILED:"Upload không thành công",
  ORPHAN_PENDING_PURGE:"Đang xử lý dọn lỗi lưu trữ",
};
const failures:Record<string,string>={
  AUTH_REQUIRED:"Phiên đăng nhập không hợp lệ. Vui lòng đăng nhập lại.",
  ROLE_DENIED:"Bạn không có quyền xem tệp chưa quét hoặc quản lý vùng cách ly.",
  MEDIA_LIBRARY_UNAVAILABLE:"Không thể tải danh sách Media lúc này.",
  MEDIA_QUARANTINE_NOT_ENABLED:"Media riêng tư chưa được kích hoạt.",
  MEDIA_STATE_CONFLICT:"Trạng thái đã thay đổi. Hãy tải lại danh sách.",
  MEDIA_REVOKE_UNAVAILABLE:"Chưa thể thu hồi tệp. Hãy thử lại.",
  ORIGIN_DENIED:"Thao tác không hợp lệ từ trang khác.",
};
function shortDate(value:string){
  const date=new Date(value.replace(" ","T")+"Z");
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString("vi-VN",{timeZone:"Asia/Ho_Chi_Minh"});
}
function size(bytes:number){return bytes>=1048576?(bytes/1048576).toFixed(2)+" MiB":(bytes/1024).toFixed(1)+" KiB";}

export function MediaPrivateLibrary(){
  const [page,setPage]=useState(1);
  const [reload,setReload]=useState(0);
  const [data,setData]=useState<Inventory|null>(null);
  const [loading,setLoading]=useState(true);
  const [error,setError]=useState("");
  const [pending,setPending]=useState<string|null>(null);
  const [filter,setFilter]=useState("all");
  const refresh=useCallback(()=>setReload(x=>x+1),[]);

  useEffect(()=>{
    const controller=new AbortController();
    setLoading(true);setError("");
    void fetch("/api/admin/cms/media/library?page="+page,{
      credentials:"same-origin",cache:"no-store",signal:controller.signal,
    }).then(async response=>{
      const result=await response.json() as Inventory;
      if(controller.signal.aborted)return;
      setData(result);
      if(!response.ok||!result.ok)setError(failures[result.ok?"":result.code]??"Không thể truy cập thư viện cách ly.");
    }).catch(()=>{
      if(!controller.signal.aborted){setData(null);setError("Không thể kết nối tới Media. Hãy thử lại.");}
    }).finally(()=>{if(!controller.signal.aborted)setLoading(false);});
    return()=>controller.abort();
  },[page,reload]);

  const items=data?.ok?data.items:[];
  const displayed=filter==="all"?items:items.filter(item=>item.state===filter);
  async function revoke(item:Item){
    if(!item.canRevoke||pending)return;
    if(!window.confirm("Thu hồi ảnh “"+item.filename+"”? Ảnh vẫn được cách ly, không thể sử dụng hoặc xuất bản; việc dọn tệp tuân theo thời hạn lưu trữ."))return;
    setError("");setPending(item.id);
    try{
      const response=await fetch("/api/admin/cms/media/library",{
        method:"POST",credentials:"same-origin",cache:"no-store",redirect:"error",
        headers:{"Content-Type":"application/json","Accept":"application/json"},
        body:JSON.stringify({action:"revoke",id:item.id,revision:item.revision}),
      });
      const result=await response.json() as {ok:boolean;code?:string};
      if(!response.ok||!result.ok){
        setError(failures[result.code??""]??"Không thể thu hồi tệp; không có thay đổi nào được xác nhận.");
        return;
      }
      refresh();
    }catch{setError("Không xác nhận được thao tác thu hồi. Vui lòng tải lại danh sách.");}
    finally{setPending(null);}
  }

  return <main className={styles.page} id="main-content">
    <header className={styles.hero}>
      <span className={styles.eyebrow}>IAICT CMS / MEDIA RIÊNG TƯ</span>
      <h1>Thư viện Media cách ly</h1>
      <p>Quản lý ảnh đã tải lên. Tệp gốc đang cách ly <strong>không có liên kết công khai, không hiển thị xem trước</strong> trước khi có kết quả quét an toàn.</p>
      <div className={styles.actions}>
        <Link href="/admin/media/upload" className={styles.primary}>Tải ảnh mới</Link>
        <Link href="/admin/tools/compression" className={styles.secondary}>Nén ảnh & tệp</Link>
        <button type="button" className={styles.secondary} onClick={refresh} disabled={loading||!!pending}>Làm mới</button>
      </div>
    </header>
    <section className={styles.notice} role="status">
      <strong><span className={styles.dot}/> Kho riêng tư · Chưa phát hành</strong>
      <p>Chỉ Admin và Reviewer xem được danh sách toàn bộ trong phạm vi CMS; Editor chỉ xem tệp mình tải. Viewer không được truy cập metadata ảnh chưa quét. Admin có thể thu hồi ảnh; việc xoá byte khỏi R2 được thực hiện theo quy trình dọn an toàn.</p>
    </section>
    <section className={styles.panel} aria-labelledby="media-list-title">
      <div className={styles.toolbar}>
        <h2 id="media-list-title">Tệp trong vùng cách ly</h2>
        <label>Trạng thái
          <select value={filter} onChange={e=>setFilter(e.target.value)} aria-label="Lọc trạng thái Media">
            <option value="all">Tất cả</option>
            <option value="QUARANTINED">Chờ quét</option>
            <option value="REVOKED">Đã thu hồi</option>
            <option value="PURGED">Đã dọn</option>
            <option value="FAILED">Thất bại</option>
            <option value="PURGE_PENDING">Đang dọn</option>
          </select>
        </label>
      </div>
      {error?<p className={styles.error} role="alert">{error}</p>:null}
      {loading?<p className={styles.empty} role="status">Đang tải danh sách Media…</p>:
       !data?.ok?null:displayed.length===0?<p className={styles.empty}>Không có tệp phù hợp trên trang này.</p>:
       <div className={styles.grid}>
        {displayed.map(item=><article className={styles.file} key={item.id}>
          <div className={styles.fileHead}>
            <span className={styles.fileIcon} aria-hidden="true">▧</span>
            <div className={styles.fileName}>
              <strong title={item.filename}>{item.filename}</strong>
              <small>{item.mimeType} · {size(item.bytes)}</small>
            </div>
          </div>
          <p className={styles.state} data-revoked={item.state==="REVOKED"?"true":"false"}>{descriptions[item.state]??"Trạng thái nội bộ: "+item.state}</p>
          <dl className={styles.meta}>
            <div><dt>Ngày tải lên</dt><dd>{shortDate(item.createdAt)}</dd></div>
            <div><dt>Quét riêng tư</dt><dd>{item.scanPrivate?"Có bằng chứng quét nội bộ · Chưa xuất bản":"Chưa có kết quả quét"}</dd></div>
          </dl>
          <div className={styles.fileActions}>
            {item.canRevoke?
              <button type="button" disabled={pending!==null} onClick={()=>void revoke(item)}>
                {pending===item.id?"Đang thu hồi…":"Thu hồi"}
              </button>:
              <span>Không có thao tác công khai</span>}
          </div>
        </article>)}
       </div>}
      <footer className={styles.pagination}>
        <span>Trang {page} · Tối đa 20 tệp/trang</span>
        <div>
          <button type="button" disabled={page===1||loading||!!pending} onClick={()=>{setPage(p=>Math.max(1,p-1));setFilter("all");}}>Trước</button>
          <button type="button" disabled={!data?.ok||!data.hasNext||loading||!!pending} onClick={()=>{setPage(p=>p+1);setFilter("all");}}>Sau</button>
        </div>
      </footer>
    </section>
  </main>;
}
