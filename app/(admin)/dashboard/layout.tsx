import type { Metadata } from "next";
import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { ADMIN_SESSION_COOKIE, validateAdminSession } from "../../../lib/admin-auth";
import "../../dashboard.css";
import "../../admin-auth.css";
import "../../admin-editor.css";
import "../../admin-media.css";
import "../../admin-workflow.css";
import "../../admin-users.css";

export const metadata: Metadata = {
  title: "Dashboard quản trị",
  description: "Không gian quản trị nội dung IAICT.",
  robots: {
    index: false,
    follow: false,
  },
};

const primaryNav = [
  { href: "/dashboard", label: "Tổng quan", code: "01" },
  { href: "/dashboard/noi-dung", label: "Nội dung", code: "02" },
  { href: "/dashboard/thu-vien", label: "Thư viện Media", code: "03" },
];

const upcomingNav = [
  { label: "Sự kiện", code: "05" },
  { label: "Dự án", code: "06" },
  { label: "Chuyên gia", code: "07" },
];

function roleLabel(role: "editor" | "reviewer" | "superadmin") {
  if (role === "editor") return "Biên tập viên";
  if (role === "reviewer") return "Người duyệt";
  return "Quản trị cấp cao";
}

export default async function DashboardLayout({ children }: Readonly<{ children: ReactNode }>) {
  const cookieStore = await cookies();
  const session = await validateAdminSession(cookieStore.get(ADMIN_SESSION_COOKIE)?.value);
  if (!session) redirect("/admin-login");

  const nav = session.role === "superadmin"
    ? [...primaryNav, { href: "/dashboard/nguoi-dung", label: "Người dùng & quyền", code: "04" }]
    : primaryNav;

  return (
    <div className="admin-app">
      <aside className="admin-sidebar">
        <div className="admin-brand">
          <Link href="/dashboard" aria-label="IAICT Dashboard">
            <span className="admin-brand-mark">IA</span>
            <span>
              <strong>IAICT</strong>
              <small>Content Operations</small>
            </span>
          </Link>
        </div>

        <div className="admin-workspace-label">Workspace</div>
        <nav className="admin-nav" aria-label="Điều hướng dashboard">
          {nav.map((item) => (
            <Link key={item.href} href={item.href}>
              <span>{item.code}</span>
              <strong>{item.label}</strong>
              <i aria-hidden="true">↗</i>
            </Link>
          ))}
          {upcomingNav.map((item) => (
            <div className="admin-nav-disabled" key={item.label} aria-disabled="true">
              <span>{item.code}</span>
              <strong>{item.label}</strong>
              <small>Sắp tới</small>
            </div>
          ))}
        </nav>

        <div className="admin-sidebar-bottom">
          <div className="admin-environment">
            <span className="admin-status-dot" aria-hidden="true"></span>
            <div>
              <strong>{session.displayName}</strong>
              <small>{roleLabel(session.role)}</small>
            </div>
          </div>
          <Link className="admin-public-link" href="/">
            Mở cổng thông tin <span aria-hidden="true">↗</span>
          </Link>
        </div>
      </aside>

      <div className="admin-stage">
        <header className="admin-topbar">
          <div>
            <span>IAICT Admin</span>
            <strong>Không gian quản trị nội dung</strong>
          </div>
          <div className="admin-topbar-actions">
            <Link href="/tin-tuc">Xem newsroom</Link>
            <span className="admin-auth-user">{session.displayName} · {roleLabel(session.role)}</span>
            <form action="/api/admin/logout" method="post">
              <button type="submit">Đăng xuất</button>
            </form>
            <span className="admin-preview-badge admin-secure-badge">SECURE</span>
          </div>
        </header>
        <main id="main-content" className="admin-main">
          {children}
        </main>
      </div>
    </div>
  );
}
