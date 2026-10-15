"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { CmsRoleCode, CmsRoleDefinition } from "@/lib/cms-roles";
import styles from "./user-management.module.css";

type UserRecord = {
  id: string;
  email: string;
  display_name: string | null;
  access_subject: string | null;
  is_active: number;
  created_at: string;
  updated_at: string;
  roles: CmsRoleCode[];
};

type Payload = {
  actor: { id: string; email: string; roles: CmsRoleCode[] };
  users: UserRecord[];
  roles: CmsRoleDefinition[];
};

type Draft = {
  email: string;
  displayName: string;
  isActive: boolean;
  roles: CmsRoleCode[];
};

const EMPTY: Draft = { email: "", displayName: "", isActive: true, roles: [] };

function formatTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("vi-VN", { dateStyle: "short", timeStyle: "short" }).format(date);
}

export function UserManagement() {
  const [payload, setPayload] = useState<Payload | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [draft, setDraft] = useState<Draft>(EMPTY);
  const [q, setQ] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const load = useCallback(async () => {
    const response = await fetch("/api/admin/cms/users", { cache: "no-store" });
    const data = await response.json() as Payload & { error?: string };
    if (!response.ok) throw new Error(data.error || `HTTP ${response.status}`);
    setPayload(data);
    setSelectedId((current) => {
      const selected = data.users.find((user) => user.id === current) ?? data.users[0] ?? null;
      if (selected) setDraft({ email: selected.email, displayName: selected.display_name ?? "", isActive: selected.is_active === 1, roles: selected.roles });
      return selected?.id ?? null;
    });
  }, []);

  useEffect(() => { void load().catch((cause) => setError(cause instanceof Error ? cause.message : String(cause))); }, [load]);

  const users = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!payload || !needle) return payload?.users ?? [];
    return payload.users.filter((user) => `${user.display_name ?? ""} ${user.email} ${user.roles.join(" ")}`.toLowerCase().includes(needle));
  }, [payload, q]);

  const selected = payload?.users.find((user) => user.id === selectedId) ?? null;
  const cmsRoles = payload?.roles.filter((role) => role.scope === "cms") ?? [];
  const newsroomRoles = payload?.roles.filter((role) => role.scope === "newsroom") ?? [];

  function selectUser(user: UserRecord) {
    setSelectedId(user.id);
    setDraft({ email: user.email, displayName: user.display_name ?? "", isActive: user.is_active === 1, roles: user.roles });
    setError(null); setMessage(null);
  }

  function startNew() {
    setSelectedId(null);
    setDraft(EMPTY);
    setError(null); setMessage(null);
  }

  function toggleRole(role: CmsRoleDefinition) {
    setDraft((current) => {
      const exists = current.roles.includes(role.code);
      if (exists) return { ...current, roles: current.roles.filter((item) => item !== role.code) };
      if (role.code === "admin") return { ...current, roles: ["admin"] };

      const withoutAdmin = current.roles.filter((item) => item !== "admin");
      const filtered = withoutAdmin.filter((item) => {
        const definition = payload?.roles.find((candidate) => candidate.code === item);
        return definition?.scope !== role.scope;
      });
      return { ...current, roles: [...filtered, role.code] };
    });
  }

  async function save() {
    setBusy(true); setError(null); setMessage(null);
    try {
      const response = await fetch("/api/admin/cms/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: selectedId, email: draft.email, displayName: draft.displayName, isActive: draft.isActive, roles: draft.roles }),
      });
      const result = await response.json() as { id?: string; error?: string };
      if (!response.ok) throw new Error(result.error || `HTTP ${response.status}`);
      setSelectedId(result.id ?? selectedId);
      setMessage(selectedId ? "Đã cập nhật người dùng và vai trò." : "Đã thêm người dùng CMS.");
      await load();
    } catch (cause) { setError(cause instanceof Error ? cause.message : String(cause)); }
    finally { setBusy(false); }
  }

  async function deactivate() {
    if (!selectedId || !window.confirm("Vô hiệu hóa người dùng này? Họ sẽ không thể truy cập CMS dù vẫn đăng nhập được qua Cloudflare Access.")) return;
    setBusy(true); setError(null); setMessage(null);
    try {
      const response = await fetch("/api/admin/cms/users", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: selectedId }) });
      const result = await response.json() as { error?: string };
      if (!response.ok) throw new Error(result.error || `HTTP ${response.status}`);
      setMessage("Đã vô hiệu hóa người dùng.");
      await load();
    } catch (cause) { setError(cause instanceof Error ? cause.message : String(cause)); }
    finally { setBusy(false); }
  }

  function roleCard(role: CmsRoleDefinition) {
    const checked = draft.roles.includes(role.code);
    const disabled = busy || (draft.roles.includes("admin") && role.code !== "admin");
    return (
      <label key={role.code} className={checked ? styles.roleSelected : styles.roleCard}>
        <div className={styles.roleHead}>
          <input type="checkbox" checked={checked} disabled={disabled} onChange={() => toggleRole(role)} />
          <div><strong>{role.name}</strong><code>{role.code}</code></div>
        </div>
        <p>{role.description}</p>
        <ul>{role.permissions.map((permission) => <li key={permission}>{permission}</li>)}</ul>
      </label>
    );
  }

  return (
    <main id="main-content" className={styles.page}>
      <header className={styles.header}>
        <div><span>IAICT CMS / ACCESS CONTROL</span><h1>Quản lý người dùng</h1><p>Quản lý tài khoản được phép sử dụng CMS và phân vai trò theo nguyên tắc tối thiểu quyền. Xác thực đăng nhập do Cloudflare Access đảm nhiệm; CMS quyết định người dùng được làm gì sau khi đăng nhập.</p></div>
        <button type="button" onClick={startNew}>+ Thêm người dùng</button>
      </header>

      <section className={styles.securityNote}>
        <div><strong>2 lớp kiểm soát</strong><span>Cloudflare Access xác thực danh tính → IAICT CMS kiểm tra tài khoản đang hoạt động và role nội bộ.</span></div>
        <div><strong>Không xóa cứng</strong><span>Người dùng bị ngừng quyền bằng trạng thái Vô hiệu hóa để giữ audit/revision.</span></div>
        <div><strong>Chống lockout</strong><span>Không thể tự vô hiệu hóa, tự gỡ quyền admin hoặc vô hiệu hóa quản trị viên hoạt động cuối cùng.</span></div>
      </section>

      {(error || message) ? <div className={error ? styles.error : styles.success}>{error ?? message}</div> : null}

      <div className={styles.toolbar}>
        <input value={q} onChange={(event) => setQ(event.target.value)} placeholder="Tìm theo tên, email hoặc role…" />
        <span>{users.length} / {payload?.users.length ?? 0} người dùng</span>
      </div>

      <section className={styles.workspace}>
        <aside className={styles.userList}>
          {users.map((user) => (
            <button key={user.id} type="button" onClick={() => selectUser(user)} className={user.id === selectedId ? styles.userActive : styles.userItem}>
              <span className={user.is_active ? styles.activeDot : styles.inactiveDot} />
              <div><strong>{user.display_name || user.email}</strong><small>{user.email}</small><span>{user.roles.length ? user.roles.join(" · ") : "Chưa có role"}</span></div>
            </button>
          ))}
          {users.length === 0 ? <div className={styles.empty}>Không có người dùng phù hợp.</div> : null}
        </aside>

        <section className={styles.editor}>
          <div className={styles.editorHead}>
            <div><span>{selected ? "Chỉnh sửa người dùng" : "Thêm người dùng"}</span><strong>{selected?.display_name || selected?.email || "Tài khoản mới"}</strong></div>
            {selected ? <small>Cập nhật {formatTime(selected.updated_at)}</small> : null}
          </div>

          <div className={styles.fields}>
            <label><span>Email Cloudflare Access *</span><input type="email" value={draft.email} onChange={(e) => setDraft({ ...draft, email: e.target.value })} placeholder="name@example.com" /></label>
            <label><span>Tên hiển thị</span><input value={draft.displayName} onChange={(e) => setDraft({ ...draft, displayName: e.target.value })} /></label>
            <label className={styles.toggle}><input type="checkbox" checked={draft.isActive} onChange={(e) => setDraft({ ...draft, isActive: e.target.checked })} /><span><strong>{draft.isActive ? "Đang hoạt động" : "Đã vô hiệu hóa"}</strong><small>Tắt trạng thái này sẽ chặn quyền dùng CMS.</small></span></label>
          </div>

          <div className={styles.roleSection}>
            <div className={styles.sectionTitle}><div><span>Vai trò toàn CMS</span><strong>Chọn tối đa 1 vai trò</strong></div><p>`admin` là toàn quyền và không cần chọn thêm role khác.</p></div>
            <div className={styles.roleGrid}>{cmsRoles.map(roleCard)}</div>
          </div>

          <div className={styles.roleSection}>
            <div className={styles.sectionTitle}><div><span>Vai trò riêng Newsroom</span><strong>Tùy chọn · chọn tối đa 1</strong></div><p>Dùng khi cần tăng quyền Newsroom mà không nâng quyền toàn CMS. Ví dụ: Biên tập viên CMS + Duyệt Newsroom.</p></div>
            <div className={styles.roleGrid}>{newsroomRoles.map(roleCard)}</div>
          </div>

          <div className={styles.actions}>
            <button type="button" disabled={busy || !draft.email || draft.roles.length === 0} onClick={() => void save()}>{busy ? "Đang lưu…" : selectedId ? "Lưu thay đổi" : "Thêm người dùng"}</button>
            {selected?.is_active === 1 ? <button type="button" className={styles.danger} disabled={busy} onClick={() => void deactivate()}>Vô hiệu hóa</button> : null}
            {selectedId ? <button type="button" className={styles.secondary} disabled={busy} onClick={() => selected && selectUser(selected)}>Hoàn tác form</button> : null}
          </div>
        </section>
      </section>
    </main>
  );
}
