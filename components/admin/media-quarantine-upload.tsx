"use client";

import { useCallback, useEffect, useRef, useState, type ChangeEvent } from "react";
import Link from "next/link";
import { MEDIA_POLICY } from "@/lib/media-policy";
import styles from "./media-quarantine-upload.module.css";

type Gate = {
  ok: boolean;
  quarantineEnabled?: boolean;
  scannerConfigured?: boolean;
  publicationEnabled?: boolean;
  roleAllowed?: boolean;
  code?: string;
};
type UploadResponse =
  | {ok:true;id:string;state:"QUARANTINED";requiresScan:true;publicUrl:null}
  | {ok:false;code:string};

const messages:Record<string,string>={
  MEDIA_QUARANTINE_NOT_ENABLED:"Dịch vụ upload staging chưa được kích hoạt. Không có dữ liệu nào được gửi.",
  MEDIA_SCHEMA_UNAVAILABLE:"Cơ sở dữ liệu Media chưa sẵn sàng.",
  MEDIA_UNAVAILABLE:"Máy chủ Media tạm thời không khả dụng.",
  AUTH_REQUIRED:"Phiên đăng nhập đã hết hạn. Hãy đăng nhập CMS rồi thử lại.",
  ROLE_DENIED:"Tài khoản không có quyền tải Media lên (cần admin hoặc editor).",
  ORIGIN_DENIED:"Yêu cầu không hợp lệ từ trang khác.",
  UNSUPPORTED_MIME:"Chỉ chấp nhận JPEG, PNG hoặc WebP tĩnh.",
  SIGNATURE_MISMATCH:"Nội dung tệp không đúng với loại ảnh.",
  INVALID_FILENAME:"Tên tệp không an toàn hoặc không được hỗ trợ.",
  BODY_TOO_LARGE:"Dung lượng ảnh vượt 10 MiB.",
  IMAGE_TOO_LARGE:"Ảnh vượt hạn mức kích thước.",
  INVALID_IDEMPOTENCY:"Yêu cầu upload không có mã an toàn.",
  IDEMPOTENCY_CONFLICT:"Mã upload đã dùng với một nội dung khác. Chọn lại tệp để thử.",
  MEDIA_QUOTA_OR_RESERVATION_CONFLICT:"Đã vượt hạn mức upload hoặc hệ thống đang bận.",
  QUARANTINE_PERSIST_FAILED:"Không thể lưu trữ an toàn trong vùng cách ly; hãy thử lại.",
};
const supported=new Set(["image/jpeg","image/png","image/webp"]);
const deadlineMs=35_000;

export function MediaQuarantineUpload() {
  const [gate,setGate]=useState<Gate|null>(null);
  const [loading,setLoading]=useState(true);
  const [file,setFile]=useState<File|null>(null);
  const [busy,setBusy]=useState(false);
  const [error,setError]=useState("");
  const [saved,setSaved]=useState<{id:string;name:string}|null>(null);
  const [epoch,setEpoch]=useState(0);
  const idempotency=useRef<string|null>(null);

  useEffect(()=>{
    const controller=new AbortController();
    setLoading(true);
    setGate(null);
    void fetch("/api/admin/cms/media/quarantine",{credentials:"same-origin",cache:"no-store",signal:controller.signal})
      .then(async response=>{
        const result=await response.json() as Gate;
        if(!controller.signal.aborted)setGate({...result,roleAllowed:response.ok?result.roleAllowed:false});
      })
      .catch(()=>{if(!controller.signal.aborted)setGate({ok:false,code:"MEDIA_UNAVAILABLE"});})
      .finally(()=>{if(!controller.signal.aborted)setLoading(false);});
    return()=>controller.abort();
  },[epoch]);

  function choose(event:ChangeEvent<HTMLInputElement>) {
    setFile(event.currentTarget.files?.[0]??null);
    setError("");
    setSaved(null);
    // Keep the id only across retries for the exact same selected file.
    idempotency.current=null;
  }
  const ready=gate?.ok===true && gate.quarantineEnabled===true && gate.roleAllowed===true;
  const canUpload=ready && file!==null && !busy;

  const submit=useCallback(async()=>{
    if(!file || busy || !ready)return;
    setError("");setSaved(null);
    if(!supported.has(file.type)) {setError(messages.UNSUPPORTED_MIME);return;}
    if(file.size===0 || file.size>MEDIA_POLICY.file.maxBytes) {
      setError("Chỉ chấp nhận ảnh không rỗng, tối đa 10 MiB.");return;
    }
    if(file.name.length>200) {setError(messages.INVALID_FILENAME);return;}
    const idem=idempotency.current??crypto.randomUUID();
    idempotency.current=idem;
    setBusy(true);
    const abort=new AbortController();
    const timer=setTimeout(()=>abort.abort(),deadlineMs);
    try {
      const response=await fetch("/api/admin/cms/media/quarantine",{
        method:"POST",
        credentials:"same-origin",
        cache:"no-store",
        redirect:"error",
        signal:abort.signal,
        headers:{
          "content-type":file.type,
          "x-media-filename":encodeURIComponent(file.name),
          "idempotency-key":idem,
          "accept":"application/json",
        },
        body:file,
      });
      const result=await response.json() as UploadResponse;
      if(!response.ok || result.ok===false) {
        const code = result.ok===false ? result.code : "MEDIA_UNAVAILABLE";
        setError(messages[code]??"Upload chưa thành công ("+code+").");
        return;
      }
      if(result.state!=="QUARANTINED"||result.publicUrl!==null||result.requiresScan!==true){
        setError("Máy chủ trả về trạng thái Media không hợp lệ.");return;
      }
      setSaved({id:result.id,name:file.name});
    }catch{
      // POST could have committed before network loss. Keep idempotency key
      // on retry so the backend can deduplicate rather than duplicate objects.
      setError("Không xác nhận được upload. Thử lại để kiểm tra cùng mã yêu cầu.");
    }finally{clearTimeout(timer);setBusy(false);}
  },[busy,file,ready]);

  return <main className={styles.page} id="main-content">
    <header className={styles.hero}>
      <span className={styles.eyebrow}>CMS / Media · STAGING</span>
      <h1>Tải ảnh vào vùng cách ly</h1>
      <p>Ảnh được lưu riêng tư trên R2 và chờ quét an toàn. Chức năng này <strong>không xuất bản ảnh lên website</strong>.</p>
    </header>
    <section className={styles.banner} aria-label="Trạng thái bảo vệ Media" role="status">
      <span className={styles.indicator} data-active={ready?"true":"false"}/>
      <div>
        <strong>{loading?"Đang kiểm tra quyền và cấu hình…":ready?"Upload cách ly đang mở":"Upload cách ly chưa sẵn sàng"}</strong>
        <p>{loading?"Vui lòng chờ xác minh phiên CMS.":gate?.code?messages[gate.code]??gate.code:
          ready?"Chỉ admin/editor được tải lên; mọi file vẫn ở trạng thái chờ quét.":
          gate?.roleAllowed===false?"Tài khoản cần quyền admin hoặc editor.":"Chưa bật tính năng upload trên môi trường này."}</p>
      </div>
      <button type="button" onClick={()=>setEpoch(x=>x+1)} disabled={busy||loading}>Kiểm tra lại</button>
    </section>
    <section className={styles.layout}>
      <div className={styles.card}>
        <h2>01 · Chọn ảnh cần tải</h2>
        <p>Chỉ nhận JPEG, PNG hoặc WebP tĩnh; tối đa {MEDIA_POLICY.file.maxBytes/1024/1024} MiB mỗi ảnh, giới hạn tần suất và dung lượng theo tài khoản.</p>
        <label htmlFor="iaict-upload-media">Chọn tệp ảnh trên thiết bị</label>
        <input id="iaict-upload-media" type="file" accept="image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp" onChange={choose} disabled={busy||!ready}/>
        {file?<p className={styles.filename}>Đã chọn: <strong>{file.name}</strong> · {(file.size/1024).toFixed(1)} KiB</p>:null}
        <button type="button" className={styles.primary} onClick={()=>void submit()} disabled={!canUpload}>
          {busy?"Đang gửi ảnh vào vùng cách ly…":"Tải lên vùng cách ly"}
        </button>
        {error?<p className={styles.error} role="alert">{error}</p>:null}
        {saved?<div className={styles.success} role="status">
          <strong>Ảnh đã được lưu vào vùng cách ly riêng tư.</strong>
          <p>{saved.name}</p>
          <p>Mã lưu trữ: <code>{saved.id}</code></p>
          <p><strong>QUARANTINED · Chờ quét</strong> — chưa có đường dẫn công khai; không thể dùng làm ảnh bài viết hoặc website.</p>
          <p><Link href="/admin/media/library">Xem Media đã tải lên và trạng thái cách ly</Link></p>
        </div>:null}
      </div>
      <aside className={styles.card}>
        <h2>02 · Quy trình tiếp theo</h2>
        <ol>
          <li>Hệ thống xác thực CMS, vai trò và hạn mức.</li>
          <li>Ảnh được kiểm tra kiểu tệp và lưu riêng trong R2.</li>
          <li>Chờ dịch vụ antivirus và bộ giải mã an toàn xử lý.</li>
          <li>Chỉ ảnh có bằng chứng quét, được duyệt và xuất bản riêng mới có thể sử dụng.</li>
        </ol>
        <p><Link href="/admin/media/library">Mở thư viện Media riêng tư</Link></p>
        <div className={styles.note}><strong>Trạng thái scanner:</strong> {gate?.scannerConfigured?"Đã khai báo":"Chưa kết nối"}.
          <p>Việc lưu file vào vùng cách ly không đồng nghĩa file đã an toàn hoặc được duyệt.</p>
        </div>
      </aside>
    </section>
  </main>;
}
