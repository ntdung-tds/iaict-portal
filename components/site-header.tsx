"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useRef } from "react";
import { mainNavigation } from "@/lib/public-content";
import styles from "./site-chrome.module.css";

const primaryHrefs = ["/gioi-thieu", "/giai-phap-dich-vu", "/san-pham-nen-tang", "/dao-tao-tap-huan"];
const moreHrefs = ["/chuyen-giao-cong-nghe", "/du-an", "/tin-tuc"];
const primaryItems = mainNavigation.filter((item) => primaryHrefs.includes(item.href));
const moreItems = mainNavigation.filter((item) => moreHrefs.includes(item.href));
const contactItem = mainNavigation.find((item) => item.href === "/lien-he") ?? { label: "Liên hệ & Hợp tác", href: "/lien-he" };

export function SiteHeader() {
  const pathname = usePathname();
  const headerRef = useRef<HTMLElement>(null);
  const current = (href: string) => pathname === href || (href !== "/" && pathname?.startsWith(href + "/"));
  const closeMenus = () => headerRef.current?.querySelectorAll("details[open]").forEach(el => el.removeAttribute("open"));
  return (
    <header ref={headerRef} className={`${styles.header} v12-header`}
      onKeyDown={event => { if (event.key === "Escape") { const open = headerRef.current?.querySelector("details[open]"); closeMenus(); (open?.querySelector("summary") as HTMLElement | null)?.focus(); } }}
      onClick={event => { if ((event.target as HTMLElement).closest("a")) closeMenus(); }}>
      <div className={styles.topline}>
        <div className={`shell ${styles.toplineInner}`}>
          <span>Cổng thông tin điện tử · IAICT</span>
          <span>Công nghệ · Giải pháp · Chuyển giao · Đào tạo</span>
        </div>
      </div>

      <div className={`shell ${styles.brandRow}`}>
        <Link className={styles.brand} href="/" aria-label="IAICT - Trang chủ">
          <span className={styles.brandMark} aria-hidden="true">IA</span>
          <span>
            <strong>IAICT</strong>
            <small>Viện Ứng dụng Công nghệ Thông tin và Truyền thông</small>
          </span>
        </Link>

        <nav className={styles.desktopNav} aria-label="Điều hướng chính">
          {primaryItems.map((item) => (
            <Link href={item.href} key={item.href} aria-current={current(item.href) ? "page" : undefined}>{item.label}</Link>
          ))}
          <details className={styles.dropdown}>
            <summary>Khám phá</summary>
            <div className={styles.dropdownPanel}>
              {moreItems.map((item) => (
                <Link href={item.href} key={item.href} aria-current={current(item.href) ? "page" : undefined}>{item.label}</Link>
              ))}
            </div>
          </details>
        </nav>

        <div className={styles.actions}>
          <Link className={styles.search} href="/tim-kiem" aria-label="Tìm kiếm">Tìm kiếm</Link>
          <Link className={styles.cta} href={contactItem.href}>Liên hệ hợp tác</Link>
          <details className={styles.mobileMenu}>
            <summary aria-label="Mở menu">Menu</summary>
            <nav aria-label="Điều hướng di động"><span className="v12-menu-label">KHÁM PHÁ IAICT</span>
              {mainNavigation.map((item) => (
                <Link href={item.href} key={item.href} aria-current={current(item.href) ? "page" : undefined}>{item.label}</Link>
              ))}
              <Link href="/tim-kiem">Tìm kiếm</Link>
            </nav>
          </details>
        </div>
      </div>
    </header>
  );
}

