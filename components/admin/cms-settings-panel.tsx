"use client";

import { useEffect, useMemo, useState } from "react";
import { auditTime } from "@/lib/cms-audit-display";
import { isNavigationHref } from "@/lib/cms-navigation-link";
import type { CmsRoleCode } from "@/lib/cms-roles";
import styles from "./cms-settings-panel.module.css";

type SettingsPayload = {
  organizationName: string;
  settings: Record<string, unknown>;
  updatedAt: string | null;
  actor?: { roles?: CmsRoleCode[] };
};

function text(settings: Record<string, unknown>, key: string) {
  const value = settings[key];
  return typeof value === "string" ? value : "";
}
function socialObject(settings: Record<string, unknown>) {
  const value = settings.socialLinks;
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};
}
function validEmail(value: string) { return !value.trim() || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim()); }
function validHttps(value: string) {
  if (!value.trim()) return true;
  try { return new URL(value.trim()).protocol === "https:" && isNavigationHref(value.trim()); } catch { return false; }
}

export function CmsSettingsPanel() {
  const [roles, setRoles] = useState<CmsRoleCode[]>([]);
  const [organizationName, setOrganizationName] = useState("");
  const [siteTitle, setSiteTitle] = useState("");
  const [siteDescription, setSiteDescription] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [address, setAddress] = useState("");
  const [defaultSeoTitle, setDefaultSeoTitle] = useState("");
  const [defaultSeoDescription, setDefaultSeoDescription] = useState("");
  const [facebook, setFacebook] = useState("");
  const [linkedin, setLinkedin] = useState("");
  const [youtube, setYoutube] = useState("");
  const [socialExtra, setSocialExtra] = useState<Record<string, unknown>>({});
  const [updatedAt, setUpdatedAt] = useState<string | null>(null);
  const [busy, setBusy] = useState(true);
  const [dirty,setDirty] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const canAdmin = roles.includes("admin");

  const validation = useMemo(() => {
    if (!organizationName.trim()) return "Vui lòng nhập tên tổ chức.";
    if (!validEmail(contactEmail)) return "Email liên hệ chưa đúng định dạng.";
    if (![facebook, linkedin, youtube].every(validHttps)) return "Các liên kết mạng xã hội phải là URL HTTPS hợp lệ.";
    return null;
  }, [organizationName, contactEmail, facebook, linkedin, youtube]);

  function apply(payload:SettingsPayload) {
    if(payload.actor)setRoles(payload.actor.roles??[]);
    setOrganizationName(payload.organizationName);
    setSiteTitle(text(payload.settings, "siteTitle"));
    setSiteDescription(text(payload.settings, "siteDescription"));
    setContactEmail(text(payload.settings, "contactEmail"));
    setContactPhone(text(payload.settings, "contactPhone"));
    setAddress(text(payload.settings, "address"));
    setDefaultSeoTitle(text(payload.settings, "defaultSeoTitle"));
    setDefaultSeoDescription(text(payload.settings, "defaultSeoDescription"));
    const social = socialObject(payload.settings);
    setFacebook(typeof social.facebook === "string" ? social.facebook : "");
    setLinkedin(typeof social.linkedin === "string" ? social.linkedin : "");
    setYoutube(typeof social.youtube === "string" ? social.youtube : "");
    setSocialExtra(Object.fromEntries(Object.entries(social).filter(([key]) => !["facebook", "linkedin", "youtube"].includes(key))));
    setUpdatedAt(payload.updatedAt);setDirty(false);
  }

  async function load(signal?:AbortSignal) {
    setBusy(true);setError(null);setMessage(null);
    try{const response=await fetch("/api/admin/cms/settings",{cache:"no-store",signal});const payload=await response.json();if(!response.ok)throw new Error(payload.error||"Không thể tải cấu hình website.");if(!signal?.aborted)apply(payload);}
    catch(cause){if(!signal?.aborted)setError(cause instanceof Error?cause.message:String(cause));}
    finally{if(!signal?.aborted)setBusy(false);}
  }
  useEffect(()=>{const controller=new AbortController();void load(controller.signal);return()=>controller.abort();},[]);
  useEffect(()=>{if(!dirty)return;const warn=(event:BeforeUnloadEvent)=>{event.preventDefault();event.returnValue="";};window.addEventListener("beforeunload",warn);return()=>window.removeEventListener("beforeunload",warn);},[dirty]);
  function reload(){if(dirty&&!window.confirm("Tải lại sẽ bỏ các thay đổi chưa lưu. Bạn có muốn tiếp tục?"))return;void load();}


  async function save() {
    if (busy || !canAdmin || validation) { if (validation) setError(validation); return; }
    setBusy(true); setError(null); setMessage(null);
    try {
      const socialLinks = { ...socialExtra, ...(facebook.trim() ? { facebook: facebook.trim() } : {}), ...(linkedin.trim() ? { linkedin: linkedin.trim() } : {}), ...(youtube.trim() ? { youtube: youtube.trim() } : {}) };
      const response = await fetch("/api/admin/cms/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ organizationName, settings: { siteTitle, siteDescription, contactEmail, contactPhone, address, defaultSeoTitle, defaultSeoDescription, socialLinks } }),
      });
      const payload = await response.json() as SettingsPayload & { error?: string };
      if (!response.ok) throw new Error(payload.error || "Không thể lưu cấu hình website.");
      apply(payload); setMessage("Đã lưu cấu hình website.");
    } catch (cause) { setError(cause instanceof Error ? cause.message : String(cause)); } finally { setBusy(false); }
  }

  const disabled = busy || !canAdmin;

  return (
    <main id="main-content" className={styles.page}>
      <header className={styles.header}>
        <div><span>IAICT CMS / SYSTEM</span><h1>Cấu hình website</h1><p>Thông tin nhận diện, liên hệ, SEO mặc định và cấu hình công khai dùng chung cho toàn hệ thống.</p></div>
        {updatedAt ? <small>Cập nhật gần nhất: {auditTime(updatedAt) + " (UTC+7)"}</small> : null}
      </header>

      {!canAdmin && roles.length ? <div className={styles.success}>Chế độ chỉ đọc. Chỉ Quản trị viên có quyền thay đổi cấu hình hệ thống.</div> : null}
      {(error || message) ? <div role={error?"alert":"status"} className={error ? styles.error : styles.success}>{error ?? message}</div> : null}

      <p className={styles.notice}>Cấu hình áp dụng trên website Cloudflare sau khi tải lại trang. GitHub Pages dùng nội dung xem trước tĩnh. Header nhận diện và các trang có nội dung cố định được quản lý riêng.</p>
      <section className={styles.grid}>
        <div className={styles.intro}><span>Thông tin chung</span><h2>Nhận diện & liên hệ</h2><p>Các giá trị này được dùng làm thông tin mặc định của website và footer.</p></div>
        <div className={styles.card}>
          <label><span>Tên tổ chức *</span><input id="settings-field-1" aria-label="Tên tổ chức" aria-describedby="settings-field-1-help" disabled={disabled} value={organizationName} onChange={(e) => {setOrganizationName(e.target.value);setDirty(true);setMessage(null);}} /><small id="settings-field-1-help">Tên đầy đủ của đơn vị vận hành website.</small></label>
          <label><span>Tên website</span><input id="settings-field-2" aria-label="Tên website" aria-describedby="settings-field-2-help" disabled={disabled} value={siteTitle} onChange={(e) => {setSiteTitle(e.target.value);setDirty(true);setMessage(null);}} /><small id="settings-field-2-help">Tiêu đề ngắn của website; SEO riêng của từng trang được ưu tiên.</small></label>
          <label className={styles.wide}><span>Mô tả website</span><textarea id="settings-field-3" aria-label="Mô tả website" aria-describedby="settings-field-3-help" disabled={disabled} rows={4} value={siteDescription} onChange={(e) => {setSiteDescription(e.target.value);setDirty(true);setMessage(null);}} /><small id="settings-field-3-help">Mô tả tổng quan, nên ngắn gọn và dễ hiểu.</small></label>
          <label><span>Email liên hệ</span><input id="settings-field-4" aria-label="Email liên hệ" aria-describedby="settings-field-4-help" disabled={disabled} type="email" value={contactEmail} onChange={(e) => {setContactEmail(e.target.value);setDirty(true);setMessage(null);}} /><small id="settings-field-4-help">Email công khai dùng cho liên hệ từ website.</small></label>
          <label><span>Điện thoại</span><input id="settings-field-5" aria-label="Điện thoại" aria-describedby="settings-field-5-help" disabled={disabled} value={contactPhone} onChange={(e) => {setContactPhone(e.target.value);setDirty(true);setMessage(null);}} /><small id="settings-field-5-help">Số điện thoại hiển thị công khai nếu có.</small></label>
          <label className={styles.wide}><span>Địa chỉ</span><textarea id="settings-field-6" aria-label="Địa chỉ" aria-describedby="settings-field-6-help" disabled={disabled} rows={3} value={address} onChange={(e) => {setAddress(e.target.value);setDirty(true);setMessage(null);}} /><small id="settings-field-6-help">Địa chỉ liên hệ chính thức của đơn vị.</small></label>
        </div>
      </section>

      <section className={styles.grid}>
        <div className={styles.intro}><span>SEO</span><h2>Mặc định tìm kiếm</h2><p>Dùng cho nội dung chưa khai báo SEO riêng. Để trống để dùng tên và mô tả website.</p></div>
        <div className={styles.card}>
          <label><span>SEO title mặc định</span><input id="settings-field-7" aria-label="SEO title mặc định" aria-describedby="settings-field-7-help" disabled={disabled} value={defaultSeoTitle} onChange={(e) => {setDefaultSeoTitle(e.target.value);setDirty(true);setMessage(null);}} /><small id="settings-field-7-help">Nên khoảng 50–60 ký tự để hiển thị tốt trên kết quả tìm kiếm.</small></label>
          <label className={styles.wide}><span>SEO description mặc định</span><textarea id="settings-field-8" aria-label="SEO description mặc định" aria-describedby="settings-field-8-help" disabled={disabled} rows={4} value={defaultSeoDescription} onChange={(e) => {setDefaultSeoDescription(e.target.value);setDirty(true);setMessage(null);}} /><small id="settings-field-8-help">Nên khoảng 120–160 ký tự, mô tả đúng nội dung website.</small></label>
        </div>
      </section>

      <section className={styles.grid}>
        <div className={styles.intro}><span>Mạng xã hội</span><h2>Liên kết công khai</h2><p>Không cần nhập JSON. Chỉ điền những kênh đang sử dụng; URL phải dùng HTTPS. Liên kết được dùng trong thông tin tổ chức dành cho công cụ tìm kiếm.</p></div>
        <div className={styles.card}>
          <label><span>Facebook</span><input id="settings-field-9" aria-label="Facebook" aria-describedby="settings-field-9-help" disabled={disabled} type="url" placeholder="https://facebook.com/..." value={facebook} onChange={(e) => {setFacebook(e.target.value);setDirty(true);setMessage(null);}} /><small id="settings-field-9-help">URL HTTPS đầy đủ của kênh Facebook. Để trống nếu chưa sử dụng.</small></label>
          <label><span>LinkedIn</span><input id="settings-field-10" aria-label="LinkedIn" aria-describedby="settings-field-10-help" disabled={disabled} type="url" placeholder="https://linkedin.com/..." value={linkedin} onChange={(e) => {setLinkedin(e.target.value);setDirty(true);setMessage(null);}} /><small id="settings-field-10-help">URL HTTPS đầy đủ của kênh LinkedIn. Để trống nếu chưa sử dụng.</small></label>
          <label className={styles.wide}><span>YouTube</span><input id="settings-field-11" aria-label="YouTube" aria-describedby="settings-field-11-help" disabled={disabled} type="url" placeholder="https://youtube.com/..." value={youtube} onChange={(e) => {setYoutube(e.target.value);setDirty(true);setMessage(null);}} /><small id="settings-field-11-help">URL HTTPS đầy đủ của kênh YouTube. Để trống nếu chưa sử dụng.</small></label>
        </div>
      </section>

      <div className={styles.actions}>
        {validation && canAdmin ? <span>{validation}</span> : null}
        {canAdmin ? <button type="button" onClick={() => void save()} disabled={busy || Boolean(validation)}>{busy ? "Đang lưu…" : "Lưu cấu hình"}</button> : null}
        <button type="button" className={styles.secondary} onClick={reload} disabled={busy}>Tải lại</button>
      </div>
    </main>
  );
}
