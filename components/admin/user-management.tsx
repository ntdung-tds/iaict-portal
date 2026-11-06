"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { CmsRoleCode,CmsRoleDefinition } from "@/lib/cms-roles";
import styles from "./user-management.module.css";

type UserRecord={id:string;email:string;display_name:string|null;access_subject:string|null;is_active:number;created_at:string;updated_at:string;roles:CmsRoleCode[];hasNativePassword?:boolean;activationPending?:boolean;activationExpiresAt?:number|null};type Payload={actor:{id:string;email:string;roles:CmsRoleCode[]};users:UserRecord[];roles:CmsRoleDefinition[]};type Draft={email:string;displayName:string;isActive:boolean;roles:CmsRoleCode[]};const EMPTY:Draft={email:"",displayName:"",isActive:true,roles:[]};
function formatTime(value:string){const date=new Date(value);return Number.isNaN(date.getTime())?value:new Intl.DateTimeFormat("vi-VN",{dateStyle:"short",timeStyle:"short"}).format(date);}function validEmail(value:string){return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());}
export function UserManagement(){
  const[payload,setPayload]=useState<Payload|null>(null);const[selectedId,setSelectedId]=useState<string|null>(null);const[draft,setDraft]=useState<Draft>(EMPTY);const[q,setQ]=useState("");const[busy,setBusy]=useState(false);const[conflicted,setConflicted]=useState(false);const[error,setError]=useState<string|null>(null);const[message,setMessage]=useState<string|null>(null);const[activation,setActivation]=useState<{url:string;expiresAt:number;userId:string}|null>(null);
  const load=useCallback(async()=>{const response=await fetch("/api/admin/cms/users",{cache:"no-store"});const data=await response.json() as Payload&{error?:string};if(!response.ok)throw new Error(data.error||"Không thể tải danh sách người dùng.");setPayload(data);setSelectedId(current=>{const selected=data.users.find(user=>user.id===current)??data.users[0]??null;if(selected)setDraft({email:selected.email,displayName:selected.display_name??"",isActive:selected.is_active===1,roles:selected.roles});return selected?.id??null;});},[]);
  useEffect(()=>{void load().catch(c=>setError(c instanceof Error?c.message:String(c)));},[load]);
  const roleMap=useMemo(()=>new Map((payload?.roles??[]).map(role=>[role.code,role.name])),[payload]);const users=useMemo(()=>{const needle=q.trim().toLowerCase();if(!payload||!needle)return payload?.users??[];return payload.users.filter(user=>`${user.display_name??""} ${user.email} ${user.roles.map(role=>roleMap.get(role)??role).join(" ")}`.toLowerCase().includes(needle));},[payload,q,roleMap]);
  const selected=payload?.users.find(user=>user.id===selectedId)??null;const isSelf=Boolean(selectedId&&payload?.actor.id===selectedId);const cmsRoles=payload?.roles.filter(role=>role.scope==="cms")??[];const newsroomRoles=payload?.roles.filter(role=>role.scope==="newsroom")??[];const validation=!draft.email.trim()?"Vui lòng nhập email tài khoản IAICT.":!validEmail(draft.email)?"Email chưa đúng định dạng.":draft.roles.length===0?"Vui lòng chọn ít nhất một vai trò.":null;
  function selectUser(user:UserRecord){setConflicted(false);setActivation(null);setSelectedId(user.id);setDraft({email:user.email,displayName:user.display_name??"",isActive:user.is_active===1,roles:user.roles});setError(null);setMessage(null);}function startNew(){setConflicted(false);setActivation(null);setSelectedId(null);setDraft(EMPTY);setError(null);setMessage(null);}function toggleRole(role:CmsRoleDefinition){setDraft(current=>{const exists=current.roles.includes(role.code);if(exists)return{...current,roles:current.roles.filter(item=>item!==role.code)};if(role.code==="admin")return{...current,roles:["admin"]};const withoutAdmin=current.roles.filter(item=>item!=="admin");const filtered=withoutAdmin.filter(item=>payload?.roles.find(candidate=>candidate.code===item)?.scope!==role.scope);return{...current,roles:[...filtered,role.code]};});setMessage(null);}
  async function save(){if(validation){setError(validation);return;}setBusy(true);setConflicted(false);setError(null);setMessage(null);setActivation(null);try{const response=await fetch("/api/admin/cms/users",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({id:selectedId,updatedAt:selected?.updated_at,email:draft.email,displayName:draft.displayName,isActive:draft.isActive,roles:draft.roles})});const result=await response.json() as {id?:string;error?:string};if(!response.ok){if(response.status===409)setConflicted(true);throw new Error(result.error||"Không thể lưu người dùng.");}setSelectedId(result.id??selectedId);setMessage(selectedId?"Đã cập nhật người dùng và vai trò.":"Đã thêm người dùng CMS.");await load();}catch(c){setError(c instanceof Error?c.message:String(c));}finally{setBusy(false);}}
  async function deactivate(){if(!selectedId||!window.confirm("Vô hiệu hóa người dùng này? Họ sẽ không thể sử dụng CMS dù vẫn có thể qua bước xác thực Cloudflare Access."))return;setBusy(true);setConflicted(false);setError(null);setMessage(null);setActivation(null);try{const response=await fetch("/api/admin/cms/users",{method:"DELETE",headers:{"Content-Type":"application/json"},body:JSON.stringify({id:selectedId,updatedAt:selected?.updated_at})});const result=await response.json() as {error?:string};if(!response.ok){if(response.status===409)setConflicted(true);throw new Error(result.error||"Không thể vô hiệu hóa người dùng.");}setMessage("Đã vô hiệu hóa người dùng.");await load();}catch(c){setError(c instanceof Error?c.message:String(c));}finally{setBusy(false);}}
  async function revokeSessions(){
    if(!selectedId||!window.confirm("Thu hồi tất cả phiên đăng nhập IAICT của người dùng này? Họ phải đăng nhập lại."))return;
    setBusy(true);setError(null);setMessage(null);
    try{
      const response=await fetch("/api/admin/cms/users",{method:"POST",headers:{"Content-Type":"application/json"},credentials:"same-origin",body:JSON.stringify({action:"revokeSessions",id:selectedId})});
      const result=await response.json() as {ok?:boolean;error?:string};
      if(!response.ok||!result.ok)throw new Error(result.error||"Không thể thu hồi phiên.");
      setMessage("Đã thu hồi toàn bộ phiên đăng nhập IAICT của tài khoản.");
      await load();
    }catch(error){setError(error instanceof Error?error.message:String(error));}
    finally{setBusy(false);}
  }
  async function issueActivation(){
    if(!selected||selected.is_active!==1||selected.hasNativePassword||selected.id===payload?.actor.id)return;
    if(!window.confirm("Tạo liên kết kích hoạt mới cho tài khoản này? Liên kết cũ (nếu có) sẽ hết hiệu lực."))return;
    setBusy(true);setError(null);setMessage(null);setActivation(null);
    try{
      const response=await fetch("/api/admin/cms/activation",{
        method:"POST",credentials:"same-origin",cache:"no-store",
        headers:{"Content-Type":"application/json"},
        body:JSON.stringify({id:selected.id}),
      });
      const result=await response.json() as {ok?:boolean;activationUrl?:string;expiresAt?:number;error?:string};
      if(!response.ok||!result.ok||!result.activationUrl||!result.expiresAt)
        throw new Error(result.error||"Không thể tạo liên kết kích hoạt.");
      setActivation({url:result.activationUrl,expiresAt:result.expiresAt,userId:selected.id});
      setMessage("Đã tạo liên kết kích hoạt dùng một lần. Sao chép và gửi qua kênh riêng cho người nhận.");
    }catch(error){setError(error instanceof Error?error.message:String(error));}
    finally{setBusy(false);}
  }
  async function revokeActivation(){
    if(!selected||selected.id===payload?.actor.id||!(selected.activationPending||activation?.userId===selected.id))return;
    if(!window.confirm("Thu hồi lời mời kích hoạt chưa sử dụng của tài khoản này? Liên kết cũ sẽ không còn hiệu lực."))return;
    setBusy(true);setError(null);setMessage(null);
    try{
      const response=await fetch("/api/admin/cms/activation",{
        method:"POST",credentials:"same-origin",cache:"no-store",
        headers:{"Content-Type":"application/json"},
        body:JSON.stringify({id:selected.id,action:"revoke"}),
      });
      const result=await response.json() as {ok?:boolean;revoked?:boolean;error?:string};
      if(!response.ok||!result.ok)throw new Error(result.error||"Không thể thu hồi lời mời.");
      setActivation(null);
      await load();
      setMessage(result.revoked?"Đã thu hồi lời mời kích hoạt.":"Không còn lời mời chưa sử dụng để thu hồi.");
    }catch(error){setError(error instanceof Error?error.message:String(error));}
    finally{setBusy(false);}
  }
  async function copyActivation(){
    if(!activation)return;
    try{
      await navigator.clipboard.writeText(activation.url);
      setMessage("Đã sao chép liên kết kích hoạt. Không công khai liên kết này.");
    }catch{setError("Không thể sao chép tự động. Bạn có thể chọn liên kết trong ô và sao chép thủ công.");}
  }
  function roleCard(role:CmsRoleDefinition){const checked=draft.roles.includes(role.code);const disabled=busy||(draft.roles.includes("admin")&&role.code!=="admin")||(isSelf&&role.code==="admin"&&checked);return<label key={role.code} className={checked?styles.roleSelected:styles.roleCard}><div className={styles.roleHead}><input type="checkbox" checked={checked} disabled={disabled} onChange={()=>toggleRole(role)}/><div><strong>{role.name}</strong><code>{role.code}</code></div></div><p>{role.description}</p><ul>{role.permissions.map(permission=><li key={permission}>{permission}</li>)}</ul></label>;}
  return <main id="main-content" className={styles.page}><header className={styles.header}><div><span>IAICT CMS / ACCESS CONTROL</span><h1>Quản lý người dùng</h1><p>Quản lý tài khoản được phép sử dụng CMS và phân vai trò theo nguyên tắc tối thiểu quyền. IAICT kiểm soát tài khoản và phân quyền nội bộ. Trong giai đoạn chuyển đổi, Cloudflare Access vẫn bảo vệ trang quản trị.</p></div><button type="button" onClick={startNew}>+ Thêm người dùng</button></header>
    <section className={styles.securityNote}><div><strong>Phân quyền IAICT</strong><span>Chỉ tài khoản đang hoạt động và được gán vai trò hợp lệ mới truy cập được chức năng quản trị.</span></div><div><strong>Kích hoạt đăng nhập</strong><span>Tạo tài khoản chỉ cấp quyền trong CMS; để sử dụng đăng nhập IAICT còn cần quy trình thiết lập mật khẩu riêng. Cloudflare Access vẫn áp dụng trên staging.</span></div><div><strong>Vô hiệu hóa / đổi quyền</strong><span>Thu hồi đồng thời các phiên IAICT đang hoạt động, lưu nhật ký và không xóa lịch sử.</span></div><div><strong>Chống lockout</strong><span>Không thể đổi email của chính mình, tự vô hiệu hóa, tự gỡ admin hoặc làm mất admin hoạt động cuối cùng.</span></div></section>
    {(error||message)?<div role={error?"alert":"status"} className={error?styles.error:styles.success}>{error??message}{conflicted?<button type="button" disabled={busy} onClick={()=>{if(window.confirm("Tải bản mới nhất? Các thay đổi chưa lưu trên biểu mẫu sẽ bị mất.")){setConflicted(false);setError(null);void load().catch(e=>setError(String(e)));}}}>Tải bản mới nhất để kiểm tra</button>:null}</div>:null}<div className={styles.toolbar}><input value={q} onChange={e=>setQ(e.target.value)} placeholder="Tìm theo tên, email hoặc vai trò…"/><span>{users.length} / {payload?.users.length??0} người dùng</span></div>
    <section className={styles.workspace}><aside className={styles.userList}>{users.map(user=><button key={user.id} type="button" onClick={()=>selectUser(user)} className={user.id===selectedId?styles.userActive:styles.userItem}><span className={user.is_active?styles.activeDot:styles.inactiveDot}/><div><strong>{user.display_name||user.email}{payload?.actor.id===user.id?" · Bạn":""}</strong><small>{user.email}</small><span>{user.roles.length?user.roles.map(role=>roleMap.get(role)??role).join(" · "):"Chưa có vai trò"}</span></div></button>)}{users.length===0?<div className={styles.empty}>Không có người dùng phù hợp.</div>:null}</aside>
      <section className={styles.editor}><div className={styles.editorHead}><div><span>{selected?"Chỉnh sửa người dùng":"Thêm người dùng"}</span><strong>{selected?.display_name||selected?.email||"Tài khoản mới"}</strong></div>{selected?<small>Cập nhật {formatTime(selected.updated_at)}</small>:null}</div><div className={styles.fields}><label><span>Email người dùng *</span><input disabled={busy||isSelf} type="email" value={draft.email} onChange={e=>{setDraft({...draft,email:e.target.value});setMessage(null);}} placeholder="name@example.com"/>{isSelf?<small>Email tài khoản đang đăng nhập được khóa để tránh tự mất quyền truy cập.</small>:<small>Email là định danh nội bộ. Sau khi tạo người dùng, Admin có thể tạo liên kết kích hoạt một lần.</small>}</label><label><span>Tên hiển thị</span><input disabled={busy} value={draft.displayName} onChange={e=>setDraft({...draft,displayName:e.target.value})}/></label><label className={styles.toggle}><input disabled={busy||isSelf} type="checkbox" checked={draft.isActive} onChange={e=>setDraft({...draft,isActive:e.target.checked})}/><span><strong>{draft.isActive?"Đang hoạt động":"Đã vô hiệu hóa"}</strong><small>{isSelf?"Không thể tự vô hiệu hóa tài khoản đang dùng.":"Tắt trạng thái này sẽ chặn quyền dùng CMS."}</small></span></label></div>
      {selected?<div className={styles.securityNote} role="status"><div><strong>Đăng nhập IAICT</strong><span>{selected.hasNativePassword?"Đã thiết lập mật khẩu IAICT. Có thể đăng nhập sau khi hoàn tất chuyển đổi khỏi Cloudflare Access.":"Chưa thiết lập mật khẩu IAICT. Admin có thể tạo liên kết kích hoạt một lần để người dùng tự đặt mật khẩu."}</span></div><div><strong>Quản lý phiên</strong><span>Khi khóa tài khoản hoặc đổi vai trò, hệ thống sẽ thu hồi phiên IAICT. Bạn cũng có thể thu hồi thủ công.</span></div>{selected.activationPending?<div><strong>Lời mời đang chờ</strong><span>Chưa sử dụng, hết hạn lúc {formatTime(new Date(selected.activationExpiresAt??0).toISOString())}. Có thể thu hồi ngay.</span></div>:null}</div>:null}
      {activation&&selected?.id===activation.userId?<section aria-label="Liên kết kích hoạt IAICT" className={styles.activationPanel}>
        <strong>Liên kết kích hoạt một lần</strong>
        <p>Hết hạn lúc {formatTime(new Date(activation.expiresAt).toISOString())}. Liên kết chứa khóa bí mật; chỉ gửi trực tiếp cho đúng người nhận bằng kênh riêng. Tạo liên kết mới sẽ làm vô hiệu liên kết trước đó.</p>
        <input aria-label="Liên kết kích hoạt IAICT" readOnly value={activation.url} onFocus={e=>e.currentTarget.select()} />
        <button type="button" disabled={busy} onClick={()=>void copyActivation()}>Sao chép liên kết</button>
      </section>:null}
      <div className={styles.roleSection}><div className={styles.sectionTitle}><div><span>Vai trò toàn CMS</span><strong>Chọn tối đa 1 vai trò</strong></div><p>Quản trị viên là toàn quyền và không cần chọn thêm vai trò khác.</p></div><div className={styles.roleGrid}>{cmsRoles.map(roleCard)}</div></div><div className={styles.roleSection}><div className={styles.sectionTitle}><div><span>Vai trò riêng Newsroom</span><strong>Tùy chọn · chọn tối đa 1</strong></div><p>Dùng khi cần tăng quyền Newsroom mà không nâng quyền toàn CMS. Ví dụ: Biên tập viên CMS + Duyệt Newsroom.</p></div><div className={styles.roleGrid}>{newsroomRoles.map(roleCard)}</div></div>
      <div className={styles.actions}>{validation?<span>{validation}</span>:null}<button type="button" disabled={busy||Boolean(validation)} onClick={()=>void save()}>{busy?"Đang lưu…":selectedId?"Lưu thay đổi":"Thêm người dùng"}</button>{selected?.is_active===1&&!isSelf?<button type="button" className={styles.danger} disabled={busy} onClick={()=>void deactivate()}>Vô hiệu hóa</button>:null}{selectedId&&selected?.hasNativePassword?<button type="button" className={styles.secondary} disabled={busy} onClick={()=>void revokeSessions()}>Thu hồi phiên IAICT</button>:null}{selectedId&&selected&&selected.is_active===1&&!selected.hasNativePassword&&!isSelf?<button type="button" className={styles.secondary} disabled={busy} onClick={()=>void issueActivation()}>Tạo liên kết kích hoạt</button>:null}{selectedId&&!isSelf&&(selected?.activationPending||activation?.userId===selectedId)?<button type="button" className={styles.danger} disabled={busy} onClick={()=>void revokeActivation()}>Thu hồi lời mời</button>:null}{selectedId?<button type="button" className={styles.secondary} disabled={busy} onClick={()=>selected&&selectUser(selected)}>Hoàn tác form</button>:null}</div></section></section>
  </main>;
}
