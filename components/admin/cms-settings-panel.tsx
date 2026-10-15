"use client";

import { useEffect, useState } from "react";
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
  const [socialLinks, setSocialLinks] = useState("{}");
  const [updatedAt, setUpdatedAt] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const canAdmin = roles.includes("admin");

  async function load() {
    setError(null);
    const response = await fetch("/api/admin/cms/settings", { cache: "no-store" });
    const payload = await response.json() as SettingsPayload & { error?: string };
    if (!response.ok) throw new Error(payload.error || `HTTP ${response.status}`);
    setRoles(payload.actor?.roles ?? []);
    setOrganizationName(payload.organizationName);
    setSiteTitle(text(payload.settings, "siteTitle"));
    setSiteDescription(text(payload.settings, "siteDescription"));
    setContactEmail(text(payload.settings, "contactEmail"));
    setContactPhone(text(payload.settings, "contactPhone"));
    setAddress(text(payload.settings, "address"));
    setDefaultSeoTitle(text(payload.settings, "defaultSeoTitle"));
    setDefaultSeoDescription(text(payload.settings, "defaultSeoDescription"));
    setSocialLinks(JSON.stringify(payload.settings.socialLinks ?? {}, null, 2));
    setUpdatedAt(payload.updatedAt);
  }

  useEffect(() => { void load().catch((cause: unknown) => setError(cause instanceof Error ? cause.message : String(cause))); }, []);

  async function save() {
    if (!canAdmin) return;
    setBusy(true); setError(null); setMessage(null);
    try {
      let links: unknown = {};
      try { links = JSON.parse(socialLinks || "{}"); } catch { throw new Error("Social links phải là JSON hợp lệ."); }
      const response = await fetch("/api/admin/cms/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ organizationName, settings: { siteTitle, siteDescription, contactEmail, contactPhone, address, defaultSeoTitle, defaultSeoDescription, socialLinks: links } }),
      });
      const payload = await response.json() as SettingsPayload & { error?: string };
      if (!response.ok) throw new Error(payload.error || `HTTP ${response.status}`);
      setUpdatedAt(payload.updatedAt); setMessage("Đã lưu cấu hình website.");
    } catch (cause) { setError(cause instanceof Error ? cause.message : String(cause)); } finally { setBusy(false); }
  }

  const disabled = busy || !canAdmin;

  return (
    <main id="main-content" className={styles.page}>
      <header className={styles.header}>
        <div><span>IAICT CMS / SYSTEM</span><h1>Cấu hình website</h1><p>Thông tin nhận diện, liên hệ, SEO mặc định và cấu hình công khai dùng chung cho toàn hệ thống.</p></div>
        {updatedAt ? <small>Cập nhật gần nhất: {new Date(updatedAt).toLocaleString("vi-VN")}</small> : null}
      </header>

      {!canAdmin && roles.length ? <div className={styles.success}>Chế độ chỉ đọc. Chỉ Quản trị viên có quyền thay đổi cấu hình hệ thống.</div> : null}
      {(error || message) ? <div className={error ? styles.error : styles.success}>{error ?? message}</div> : null}

      <section className={styles.grid}>
        <div className={styles.intro}><span>General</span><h2>Nhận diện & liên hệ</h2><p>Những giá trị này là cấu hình CMS trung tâm. Mỗi trang vẫn có thể có SEO riêng trong module Trang, Sản phẩm, Giải pháp…</p></div>
        <div className={styles.card}>
          <label><span>Tên tổ chức</span><input disabled={disabled} value={organizationName} onChange={(e) => setOrganizationName(e.target.value)} /></label>
          <label><span>Tên website</span><input disabled={disabled} value={siteTitle} onChange={(e) => setSiteTitle(e.target.value)} /></label>
          <label className={styles.wide}><span>Mô tả website</span><textarea disabled={disabled} rows={4} value={siteDescription} onChange={(e) => setSiteDescription(e.target.value)} /></label>
          <label><span>Email liên hệ</span><input disabled={disabled} type="email" value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} /></label>
          <label><span>Điện thoại</span><input disabled={disabled} value={contactPhone} onChange={(e) => setContactPhone(e.target.value)} /></label>
          <label className={styles.wide}><span>Địa chỉ</span><textarea disabled={disabled} rows={3} value={address} onChange={(e) => setAddress(e.target.value)} /></label>
        </div>
      </section>

      <section className={styles.grid}>
        <div className={styles.intro}><span>SEO</span><h2>Mặc định tìm kiếm</h2><p>Được dùng làm fallback khi một nội dung chưa khai báo metadata SEO riêng.</p></div>
        <div className={styles.card}>
          <label><span>SEO title mặc định</span><input disabled={disabled} value={defaultSeoTitle} onChange={(e) => setDefaultSeoTitle(e.target.value)} /></label>
          <label className={styles.wide}><span>SEO description mặc định</span><textarea disabled={disabled} rows={4} value={defaultSeoDescription} onChange={(e) => setDefaultSeoDescription(e.target.value)} /></label>
          <label className={styles.wide}><span>Liên kết mạng xã hội (JSON)</span><textarea disabled={disabled} rows={8} value={socialLinks} onChange={(e) => setSocialLinks(e.target.value)} spellCheck={false} /></label>
        </div>
      </section>

      <div className={styles.actions}>
        {canAdmin ? <button type="button" onClick={() => void save()} disabled={busy || !organizationName.trim()}>{busy ? "Đang lưu…" : "Lưu cấu hình"}</button> : null}
        <button type="button" className={styles.secondary} onClick={() => void load()} disabled={busy}>Tải lại</button>
      </div>
    </main>
  );
}
