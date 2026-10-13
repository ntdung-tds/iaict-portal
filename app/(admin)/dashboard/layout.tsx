import type { Metadata } from "next";
import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { ADMIN_SESSION_COOKIE, verifyAdminSession } from "../../../lib/admin-auth";
import "../../dashboard.css";
import "../../admin-auth.css";
import "../../admin-editor.css";

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
];

const upcomingNav = [
  { label: "Sự kiện", code: "03" },
  { label: "Dự án", code: "04" },
  { label: "Chuyên gia", code: "05" },
  { label: "Thư viện", code: "06" },
];

export default async function DashboardLayout({ children }: Readonly<{ children: ReactNode }>) {
  const cookieStore = await cookies();
  const session = verifyAdminSession(cookieStore.get(ADMIN_SESSION_COOKIE)?.value);
  if (!session) redirect("/admin-login");

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
          {primaryNav.map((item) => (
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
              <strong>Secured workspace</strong>
              <small>Session quản trị đang hoạt động</small>
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
            <span className="admin-auth-user">{session.username}</span>
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
