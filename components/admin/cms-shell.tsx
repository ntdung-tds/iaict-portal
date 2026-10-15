"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import styles from "./cms-shell.module.css";

type NavItem = {
  href: string;
  label: string;
  short: string;
  exact?: boolean;
};

type NavGroup = {
  label: string;
  items: NavItem[];
};

const groups: NavGroup[] = [
  {
    label: "Tổng quan",
    items: [
      { href: "/admin", label: "Dashboard", short: "DB", exact: true },
      { href: "/admin/news", label: "Newsroom", short: "NW" },
    ],
  },
  {
    label: "Nội dung",
    items: [
      { href: "/admin/articles", label: "Bài viết", short: "BV" },
      { href: "/admin/content/pages", label: "Trang", short: "TR" },
      { href: "/admin/content/products", label: "Sản phẩm", short: "SP" },
      { href: "/admin/content/solutions", label: "Giải pháp", short: "GP" },
      { href: "/admin/content/courses", label: "Đào tạo", short: "DT" },
      { href: "/admin/course-sessions", label: "Lịch lớp", short: "LL" },
      { href: "/admin/content/projects", label: "Dự án", short: "DA" },
      { href: "/admin/content/events", label: "Sự kiện", short: "SK" },
      { href: "/admin/content/experts", label: "Chuyên gia", short: "CG" },
      { href: "/admin/content/partners", label: "Đối tác", short: "ĐT" },
    ],
  },
  {
    label: "Vận hành",
    items: [
      { href: "/admin/content/media", label: "Thư viện Media", short: "MD" },
      { href: "/admin/content/leads", label: "Leads", short: "LD" },
      { href: "/admin/content/registrations", label: "Đăng ký học", short: "DK" },
      { href: "/admin/content/navigation", label: "Menu", short: "MN" },
      { href: "/admin/content/redirects", label: "Redirects", short: "RD" },
    ],
  },
  {
    label: "Hệ thống",
    items: [
      { href: "/admin/users", label: "Quản lý người dùng", short: "US" },
      { href: "/admin/revisions", label: "Phiên bản", short: "RV" },
      { href: "/admin/content/audit", label: "Nhật ký", short: "LG" },
      { href: "/admin/settings", label: "Cấu hình", short: "CF" },
    ],
  },
];

function isActive(pathname: string, item: NavItem) {
  if (item.exact) return pathname === item.href;
  return pathname === item.href || pathname.startsWith(`${item.href}/`);
}

export function CmsShell({ children }: { children: ReactNode }) {
  const pathname = usePathname() ?? "/admin";

  return (
    <div className={styles.shell}>
      <aside className={styles.sidebar} aria-label="Điều hướng CMS">
        <Link href="/admin" className={styles.brand} aria-label="IAICT CMS Dashboard">
          <span className={styles.brandMark}>IA</span>
          <span className={styles.brandText}><strong>IAICT CMS</strong><small>Control Center · V17</small></span>
        </Link>

        <nav className={styles.nav}>
          {groups.map((group) => (
            <div className={styles.group} key={group.label}>
              <span className={styles.groupLabel}>{group.label}</span>
              {group.items.map((item) => (
                <Link
                  href={item.href}
                  key={item.href}
                  title={item.label}
                  className={isActive(pathname, item) ? styles.navActive : styles.navItem}
                  aria-current={isActive(pathname, item) ? "page" : undefined}
                >
                  <span className={styles.navIcon}>{item.short}</span>
                  <span className={styles.navLabel}>{item.label}</span>
                </Link>
              ))}
            </div>
          ))}
        </nav>

        <div className={styles.sidebarFoot}>
          <a href="/" target="_blank" rel="noreferrer" title="Mở website">
            <span className={styles.navIcon}>↗</span>
            <span className={styles.navLabel}>Mở website</span>
          </a>
          <span className={styles.secure}><i />Cloudflare Access</span>
        </div>
      </aside>
      <div className={styles.content}>{children}</div>
    </div>
  );
}
