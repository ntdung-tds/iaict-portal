"use client";

import { useMemo, useState } from "react";

type Role = "editor" | "reviewer" | "superadmin";
type User = {
  id: string;
  username: string;
  displayName: string;
  role: Role;
  active: boolean;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  bootstrap?: boolean;
};

type ApiResponse = {
  revision?: number;
  users?: User[];
  message?: string;
};

function roleLabel(role: Role) {
  if (role === "editor") return "Biên tập viên";
  if (role === "reviewer") return "Người duyệt";
  return "Quản trị cấp cao";
}

export function DashboardUserManager({ initialUsers, initialRevision }: { initialUsers: User[]; initialRevision: number }) {
  const [users, setUsers] = useState(initialUsers);
  const [revision, setRevision] = useState(initialRevision);
  const [notice, setNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({ username: "", displayName: "", role: "editor" as Role, password: "" });
  const counts = useMemo(() => ({
    editors: users.filter((u) => u.active && u.role === "editor").length,
    reviewers: users.filter((u) => u.active && u.role === "reviewer").length,
    admins: users.filter((u) => u.active && u.role === "superadmin").length,
  }), [users]);

  async function mutate(payload: Record<string, unknown>) {
    setBusy(true);
    setNotice(null);
    try {
      const response = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...payload, expectedRevision: revision }),
      });
      const data = await response.json() as ApiResponse;
      if (data.users && typeof data.revision === "number") {
        setUsers(data.users);
        setRevision(data.revision);
      }
      setNotice(response.ok ? "Đã cập nhật người dùng." : data.message ?? "Không thể cập nhật người dùng.");
      return response.ok;
    } catch {
      setNotice("Không thể kết nối API người dùng.");
      return false;
    } finally {
      setBusy(false);
    }
  }

  async function createUser() {
    if (!form.username.trim() || !form.displayName.trim() || form.password.length < 10) {
      setNotice("Cần nhập tên đăng nhập, tên hiển thị và mật khẩu tạm thời tối thiểu 10 ký tự.");
      return;
    }
    const ok = await mutate({ action: "create", ...form });
    if (ok) setForm({ username: "", displayName: "", role: "editor", password: "" });
  }

  return (
    <div className="admin-user-manager">
      <section className="admin-user-summary">
        <div><span>Biên tập viên</span><strong>{counts.editors}</strong></div>
        <div><span>Người duyệt</span><strong>{counts.reviewers}</strong></div>
        <div><span>Quản trị cấp cao</span><strong>{counts.admins}</strong></div>
        <p>Revision người dùng: {revision}. Tài khoản bootstrap không thể sửa tại đây.</p>
      </section>

      <section className="admin-user-create">
        <div className="admin-user-create-head"><span>NEW ACCOUNT</span><h2>Tạo tài khoản nội bộ</h2><p>Mật khẩu chỉ dùng để đăng nhập; hệ thống lưu bản băm scrypt + salt trong private Blob.</p></div>
        <div className="admin-user-form-grid">
          <label><span>Tên đăng nhập</span><input value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value.toLowerCase() })} placeholder="nguyenvana" /></label>
          <label><span>Tên hiển thị</span><input value={form.displayName} onChange={(e) => setForm({ ...form, displayName: e.target.value })} placeholder="Nguyễn Văn A" /></label>
          <label><span>Vai trò</span><select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value as Role })}><option value="editor">Biên tập viên</option><option value="reviewer">Người duyệt</option><option value="superadmin">Quản trị cấp cao</option></select></label>
          <label><span>Mật khẩu tạm thời</span><input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} /></label>
        </div>
        <button className="admin-button admin-button-primary" type="button" disabled={busy} onClick={createUser}>+ Tạo tài khoản</button>
      </section>

      {notice ? <div className="admin-inline-notice" role="status">{notice}</div> : null}

      <section className="admin-user-list">
        <div className="admin-user-list-head"><span>Người dùng</span><span>Vai trò</span><span>Trạng thái</span><span>Thao tác</span></div>
        {users.map((user) => (
          <article key={user.id} className={!user.active ? "is-disabled" : ""}>
            <div><strong>{user.displayName}</strong><span>@{user.username}{user.bootstrap ? " · Tài khoản hệ thống" : ""}</span></div>
            <select disabled={busy || user.bootstrap} value={user.role} onChange={(e) => mutate({ action: "update", id: user.id, displayName: user.displayName, role: e.target.value })}>
              <option value="editor">Biên tập viên</option><option value="reviewer">Người duyệt</option><option value="superadmin">Quản trị cấp cao</option>
            </select>
            <span className={`admin-status-pill ${user.active ? "is-published" : "is-draft"}`}>{user.active ? "Đang hoạt động" : "Đã khóa"}</span>
            <div className="admin-row-actions">
              {!user.bootstrap ? <button type="button" disabled={busy} onClick={() => { const password = window.prompt("Nhập mật khẩu mới (tối thiểu 10 ký tự)"); if (password) void mutate({ action: "reset-password", id: user.id, password }); }}>Đặt lại mật khẩu</button> : null}
              {!user.bootstrap ? <button type="button" disabled={busy} onClick={() => mutate({ action: "toggle-active", id: user.id, active: !user.active })}>{user.active ? "Khóa" : "Mở khóa"}</button> : null}
            </div>
          </article>
        ))}
      </section>
    </div>
  );
}
