"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import type { CmsRoleCode } from "@/lib/cms-roles";
import styles from "./cms-shell.module.css";

type NavItem={href:string;label:string;short:string;exact?:boolean;access:"cms"|"newsroom"|"admin"|"upload"|"media-library"};
type NavGroup={label:string;items:NavItem[]};
const groups:NavGroup[]=[
  {label:"Tổng quan",items:[{href:"/admin",label:"Dashboard",short:"DB",exact:true,access:"cms"},{href:"/admin/news",label:"Newsroom",short:"NW",access:"newsroom"}]},
  {label:"Nội dung",items:[{href:"/admin/articles",label:"Bài viết",short:"BV",access:"cms"},{href:"/admin/content/pages",label:"Trang",short:"TR",access:"cms"},{href:"/admin/content/products",label:"Sản phẩm",short:"SP",access:"cms"},{href:"/admin/content/solutions",label:"Giải pháp",short:"GP",access:"cms"},{href:"/admin/content/courses",label:"Đào tạo",short:"DT",access:"cms"},{href:"/admin/course-sessions",label:"Lịch lớp",short:"LL",access:"cms"},{href:"/admin/content/projects",label:"Dự án",short:"DA",access:"cms"},{href:"/admin/content/events",label:"Sự kiện",short:"SK",access:"cms"},{href:"/admin/content/experts",label:"Chuyên gia",short:"CG",access:"cms"},{href:"/admin/content/partners",label:"Đối tác",short:"ĐT",access:"cms"}]},
  {label:"Vận hành",items:[{href:"/admin/content/media",label:"Media nội dung",short:"MD",access:"cms"},{href:"/admin/media/library",label:"Media cách ly",short:"CL",access:"media-library"},{href:"/admin/media/upload",label:"Tải Media lên",short:"UP",access:"upload"},{href:"/admin/tools/compression",label:"Nén ảnh & tệp",short:"NZ",access:"cms"},{href:"/admin/content/leads",label:"Liên hệ",short:"LH",access:"cms"},{href:"/admin/content/registrations",label:"Đăng ký học",short:"DK",access:"cms"},{href:"/admin/content/navigation",label:"Menu",short:"MN",access:"cms"},{href:"/admin/content/redirects",label:"Chuyển hướng",short:"CH",access:"cms"}]},
  {label:"Hệ thống",items:[{href:"/admin/users",label:"Quản lý người dùng",short:"US",access:"admin"},{href:"/admin/security",label:"Đăng nhập & bảo mật",short:"AT",access:"admin"},{href:"/admin/revisions",label:"Phiên bản",short:"RV",access:"cms"},{href:"/admin/content/audit",label:"Nhật ký",short:"LG",access:"admin"},{href:"/admin/settings",label:"Cấu hình",short:"CF",access:"cms"}]},
];
function isActive(pathname:string,item:NavItem){return item.exact?pathname===item.href:pathname===item.href||pathname.startsWith(`${item.href}/`);}
function canSee(item:NavItem,roles:CmsRoleCode[]){if(roles.includes("admin"))return true;const hasCms=roles.some(role=>["editor","reviewer","viewer"].includes(role));if(item.access==="admin")return false;if(item.access==="upload")return roles.includes("editor");if(item.access==="media-library")return roles.includes("editor")||roles.includes("reviewer");if(item.access==="cms")return hasCms;return roles.length>0;}
export function CmsShell({ children }: { children: ReactNode }) {
  const pathname = usePathname() ?? "/admin";
  const [roles, setRoles] = useState<CmsRoleCode[] | null>(null);
  const [desktopCollapsed, setDesktopCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void fetch("/api/admin/cms/session", { cache: "no-store" })
      .then(async response => {
        const payload = await response.json() as { actor?: { roles?: CmsRoleCode[] } };
        if (!cancelled && response.ok) setRoles(payload.actor?.roles ?? []);
        else if (!cancelled) setRoles([]);
      })
      .catch(() => {
        if (!cancelled) setRoles([]);
      });
    return () => { cancelled = true; };
  }, []);

  // Close the mobile drawer on navigation or Escape. Keep the compact rail
  // visible so users always have a reliable way to reopen the menu.
  useEffect(() => { setMobileOpen(false); }, [pathname]);
  useEffect(() => {
    if (!mobileOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMobileOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [mobileOpen]);

  const visibleGroups = roles === null ? [] : groups
    .map(group => ({ ...group, items: group.items.filter(item => canSee(item, roles)) }))
    .filter(group => group.items.length > 0);

  const sidebarClass = [
    styles.sidebar,
    desktopCollapsed ? styles.sidebarCollapsed : "",
    mobileOpen ? styles.sidebarMobileOpen : "",
  ].filter(Boolean).join(" ");

  return (
    <div className={styles.shell}>
      {mobileOpen && (
        <button
          className={styles.backdrop}
          type="button"
          aria-label="Đóng menu điều hướng CMS"
          onClick={() => setMobileOpen(false)}
        />
      )}
      <aside className={sidebarClass} aria-label="Điều hướng CMS">
        <div className={styles.sidebarHeader}>
          <Link
            href="/admin"
            className={styles.brand}
            aria-label="IAICT CMS Dashboard"
            onClick={() => setMobileOpen(false)}
          >
            <span className={styles.brandMark}>IA</span>
            <span className={styles.brandText}>
              <strong>IAICT CMS</strong>
              <small>Control Center · V17</small>
            </span>
          </Link>
          <button
            type="button"
            className={styles.desktopToggle}
            onClick={() => setDesktopCollapsed(value => !value)}
            aria-expanded={!desktopCollapsed}
            aria-controls="cms-side-navigation"
            aria-label={desktopCollapsed ? "Mở rộng menu CMS" : "Thu gọn menu CMS"}
            title={desktopCollapsed ? "Mở rộng menu CMS" : "Thu gọn menu CMS"}
          >
            <span aria-hidden="true">{desktopCollapsed ? "»" : "«"}</span>
          </button>
          <button
            type="button"
            className={styles.mobileToggle}
            onClick={() => setMobileOpen(value => !value)}
            aria-expanded={mobileOpen}
            aria-controls="cms-side-navigation"
            aria-label={mobileOpen ? "Thu gọn menu CMS" : "Mở rộng menu CMS"}
            title={mobileOpen ? "Thu gọn menu CMS" : "Mở rộng menu CMS"}
          >
            <span aria-hidden="true">{mobileOpen ? "×" : "☰"}</span>
          </button>
        </div>
        <nav className={styles.nav} id="cms-side-navigation" aria-label="Các chức năng quản trị">
          {visibleGroups.map(group => (
            <div className={styles.group} key={group.label}>
              <span className={styles.groupLabel}>{group.label}</span>
              {group.items.map(item => (
                <Link
                  href={item.href}
                  key={item.href}
                  title={item.label}
                  aria-label={item.label}
                  onClick={() => setMobileOpen(false)}
                  className={isActive(pathname, item) ? styles.navActive : styles.navItem}
                  aria-current={isActive(pathname, item) ? "page" : undefined}
                >
                  <span className={styles.navIcon} aria-hidden="true">{item.short}</span>
                  <span className={styles.navLabel}>{item.label}</span>
                </Link>
              ))}
            </div>
          ))}
          {roles === null && (
            <div className={styles.group}>
              <span className={styles.groupLabel}>Đang tải quyền…</span>
            </div>
          )}
        </nav>
        <div className={styles.sidebarFoot}>
          <a href="/" target="_blank" rel="noreferrer" title="Mở website" aria-label="Mở website">
            <span className={styles.navIcon} aria-hidden="true">↗</span>
            <span className={styles.navLabel}>Mở website</span>
          </a>
          <Link href="/account" title="Tài khoản và đăng xuất" aria-label="Tài khoản và đăng xuất" onClick={() => setMobileOpen(false)}>
            <span className={styles.navIcon} aria-hidden="true">↪</span>
            <span className={styles.navLabel}>Tài khoản & đăng xuất</span>
          </Link>
          <span className={styles.secure}><i />IAICT · Bảo vệ tài khoản</span>
        </div>
      </aside>
      <div className={[styles.content, desktopCollapsed ? styles.contentCollapsed : ""].filter(Boolean).join(" ")}>
        {children}
      </div>
    </div>
  );
}
