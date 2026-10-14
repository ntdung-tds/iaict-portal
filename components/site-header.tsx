"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { mainNavigation } from "@/lib/public-content";
import styles from "./site-chrome.module.css";

const primaryHrefs = ["/gioi-thieu", "/giai-phap-dich-vu", "/san-pham-nen-tang", "/dao-tao-tap-huan"];
const moreHrefs = ["/chuyen-giao-cong-nghe", "/du-an", "/tin-tuc"];
const primaryItems = mainNavigation.filter((item) => primaryHrefs.includes(item.href));
const moreItems = mainNavigation.filter((item) => moreHrefs.includes(item.href));
const contactItem = mainNavigation.find((item) => item.href === "/lien-he") ?? { label: "Liên hệ & Hợp tác", href: "/lien-he" };

export function SiteHeader() {
  const pathname = usePathname();
  const [ready, setReady] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const headerRef = useRef<HTMLElement>(null);

  useEffect(() => setReady(true), []);

  const closeMenus = () => {
    setMobileOpen(false);
    headerRef.current?.querySelectorAll("details[open]").forEach((el) => el.removeAttribute("open"));
  };

  useEffect(() => {
    const closeOutside = (event: PointerEvent) => {
      if (event.target instanceof Node && !headerRef.current?.contains(event.target)) closeMenus();
    };
    document.addEventListener("pointerdown", closeOutside);
    return () => document.removeEventListener("pointerdown", closeOutside);
  }, []);

  useEffect(() => closeMenus(), [pathname]);

  useEffect(() => {
    if (!mobileOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [mobileOpen]);

  const current = (href: string) => pathname === href || (href !== "/" && pathname?.startsWith(href + "/"));

  return (
    <header
      data-interactive={ready}
      data-ui="final"
      data-mobile-open={mobileOpen ? "true" : "false"}
      ref={headerRef}
      className={`${styles.header} v12-header final-header`}
      onKeyDown={(event) => {
        if (event.key === "Escape") {
          const open = headerRef.current?.querySelector("details[open]");
          closeMenus();
          if (open) (open.querySelector("summary") as HTMLElement | null)?.focus();
        }
      }}
      onClick={(event) => {
        const summary = (event.target as HTMLElement).closest("summary");
        if (summary) {
          headerRef.current?.querySelectorAll("details[open]").forEach((el) => {
            if (el !== summary.parentElement) el.removeAttribute("open");
          });
        }
      }}
    >
      <div className={styles.topline}>
        <div className={`shell ${styles.toplineInner}`}>
          <span className="final-top-status"><i aria-hidden="true" />Cổng thông tin điện tử · IAICT</span>
          <span>Công nghệ · Giải pháp · Chuyển giao · Đào tạo</span>
        </div>
      </div>

      <div className={`shell ${styles.brandRow}`}>
        <Link className={styles.brand} href="/" aria-label="IAICT - Trang chủ" onClick={closeMenus}>
          <span className={styles.brandMark} aria-hidden="true">IA</span>
          <span>
            <strong>IAICT</strong>
            <small>Viện Ứng dụng Công nghệ Thông tin và Truyền thông</small>
            <span className="final-brand-meta">Applied Technology · Real-world Value</span>
          </span>
        </Link>

        <nav className={styles.desktopNav} aria-label="Điều hướng chính">
          {primaryItems.map((item) => (
            <Link href={item.href} key={item.href} aria-current={current(item.href) ? "page" : undefined} onClick={closeMenus}>{item.label}</Link>
          ))}
          <details className={styles.dropdown}>
            <summary>Khám phá</summary>
            <div className={styles.dropdownPanel}>
              {moreItems.map((item) => (
                <Link href={item.href} key={item.href} aria-current={current(item.href) ? "page" : undefined} onClick={closeMenus}>{item.label}</Link>
              ))}
            </div>
          </details>
        </nav>

        <div className={styles.actions}>
          <Link className={styles.search} href="/tim-kiem" aria-label="Tìm kiếm" onClick={closeMenus}>Tìm kiếm</Link>
          <Link className={styles.cta} href={contactItem.href} onClick={closeMenus}>Liên hệ hợp tác</Link>
          <div className={styles.mobileMenu}>
            <button
              type="button"
              className={styles.mobileToggle}
              aria-label={mobileOpen ? "Đóng điều hướng" : "Mở điều hướng"}
              aria-expanded={mobileOpen}
              aria-controls="mobile-navigation"
              onClick={() => setMobileOpen((open) => !open)}
            >
              <span className={styles.menuIcon} aria-hidden="true"><i /><i /><i /></span>
            </button>
          </div>
        </div>
      </div>

      {mobileOpen ? (
        <div className={styles.mobileLayer}>
          <button className={styles.mobileBackdrop} type="button" aria-label="Đóng điều hướng" onClick={closeMenus} />
          <nav
            id="mobile-navigation"
            className={styles.mobilePanel}
            aria-label="Điều hướng di động"
            onClick={(event) => {
              if ((event.target as HTMLElement).closest("a")) setMobileOpen(false);
            }}
          >
            <div className={styles.mobilePanelHead}>
              <div>
                <small>IAICT</small>
                <strong>Khám phá hệ sinh thái</strong>
              </div>
              <span>{mainNavigation.length + 1} mục</span>
            </div>

            <div className={styles.mobileNavList}>
              {mainNavigation.map((item, index) => (
                <Link
                  className={`${styles.mobileNavItem} ${item.href === "/lien-he" ? styles.mobileContact : ""}`}
                  href={item.href}
                  key={item.href}
                  aria-current={current(item.href) ? "page" : undefined}
                  onClick={() => setMobileOpen(false)}
                >
                  <span className={styles.mobileNavNo} aria-hidden="true">{String(index + 1).padStart(2, "0")}</span>
                  <span>{item.label}</span>
                  <span className={styles.mobileNavArrow} aria-hidden="true">↗</span>
                </Link>
              ))}
              <Link className={`${styles.mobileNavItem} ${styles.mobileSearchItem}`} href="/tim-kiem" onClick={() => setMobileOpen(false)}>
                <span className={styles.mobileNavNo} aria-hidden="true">⌕</span>
                <span>Tìm kiếm</span>
                <span className={styles.mobileNavArrow} aria-hidden="true">→</span>
              </Link>
            </div>

            <div className={styles.mobilePanelFoot}>
              <span>Applied Technology</span><i aria-hidden="true" /><span>Real-world Value</span>
            </div>
          </nav>
        </div>
      ) : null}
    </header>
  );
}
