import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";
import "../../dashboard.css";

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

export default function DashboardLayout({ children }: Readonly<{ children: ReactNode }>) {
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
              <strong>Preview workspace</strong>
              <small>Chưa kết nối xác thực / database</small>
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
            <span className="admin-preview-badge">PREVIEW</span>
          </div>
        </header>
        <main id="main-content" className="admin-main">
          {children}
        </main>
      </div>
    </div>
  );
}
