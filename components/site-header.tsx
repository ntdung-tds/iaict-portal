"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { mainNavigation as fallbackNavigation, type NavigationItem } from "@/lib/public-content";
import styles from "./site-chrome.module.css";
import headerStyles from "./site-header.module.css";

const adminUrl = process.env.NEXT_PUBLIC_CMS_URL || "/admin";

const preferredPrimaryHrefs = ["/gioi-thieu", "/giai-phap-dich-vu", "/san-pham-nen-tang", "/dao-tao-tap-huan"];
const preferredMoreHrefs = ["/chuyen-giao-cong-nghe", "/du-an", "/tin-tuc"];

export function SiteHeader() {
  const pathname = usePathname();
  const [ready, setReady] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [navigation, setNavigation] = useState<NavigationItem[]>(fallbackNavigation);
  const headerRef = useRef<HTMLElement>(null);
  const mobileToggleRef = useRef<HTMLButtonElement>(null);

  const { primaryItems, moreItems, contactItem } = useMemo(() => {
    const contact = navigation.find((item) => item.href === "/lien-he")
      ?? fallbackNavigation.find((item) => item.href === "/lien-he")
      ?? { label: "Liên hệ & Hợp tác", href: "/lien-he" };

    const primary = navigation.filter((item) => preferredPrimaryHrefs.includes(item.href));
    const more = navigation.filter((item) => preferredMoreHrefs.includes(item.href));
    const assigned = new Set([...primary.map((item) => item.href), ...more.map((item) => item.href), contact.href, "/"]);
    const remaining = navigation.filter((item) => !assigned.has(item.href));

    return {
      primaryItems: primary.length > 0 ? primary : navigation.filter((item) => item.href !== "/" && item.href !== contact.href).slice(0, 4),
      moreItems: [...more, ...remaining],
      contactItem: contact,
    };
  }, [navigation]);

  useEffect(() => setReady(true), []);

  useEffect(() => {
    let active = true;
    fetch("/api/public/navigation", { cache: "no-store" })
      .then(async (response) => {
        const payload = await response.json() as { ok?: boolean; items?: NavigationItem[] };
        if (!active || !payload.ok || !Array.isArray(payload.items) || payload.items.length === 0) return;
        const clean = payload.items.filter((item) => typeof item?.label === "string" && typeof item?.href === "string" && item.label.trim() && item.href.trim());
        if (clean.length > 0) setNavigation(clean);
      })
      .catch(() => {
        // Static navigation is the availability fallback if CMS/D1 is temporarily unavailable.
      });
    return () => { active = false; };
  }, []);

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

  useEffect(() => {
    if (!mobileOpen) return;
    const frame = window.requestAnimationFrame(() => {
      const currentLink = headerRef.current?.querySelector<HTMLElement>('#mobile-navigation a[aria-current="page"]');
      const firstLink = headerRef.current?.querySelector<HTMLElement>('#mobile-navigation a[href]');
      (currentLink ?? firstLink)?.focus();
    });
    return () => window.cancelAnimationFrame(frame);
  }, [mobileOpen]);

  const current = (href: string) => pathname === href || (href !== "/" && pathname?.startsWith(href + "/"));

  return (
    <header
      data-interactive={ready}
      data-ui="public"
      data-mobile-open={mobileOpen ? "true" : "false"}
      ref={headerRef}
      className={`${styles.header} ia-header`}
      onKeyDown={(event) => {
        if (event.key === "Tab" && mobileOpen) {
          const links = [...(headerRef.current?.querySelectorAll<HTMLElement>('#mobile-navigation a[href]') ?? [])];
          const focusable = [mobileToggleRef.current, ...links].filter((item): item is HTMLElement => Boolean(item));
          const first = focusable[0];
          const last = focusable[focusable.length - 1];
          if (event.shiftKey && document.activeElement === first) {
            event.preventDefault();
            last?.focus();
          } else if (!event.shiftKey && document.activeElement === last) {
            event.preventDefault();
            first?.focus();
          }
        }
        if (event.key === "Escape") {
          const open = headerRef.current?.querySelector("details[open]");
          const hadMobileOpen = mobileOpen;
          closeMenus();
          if (open) (open.querySelector("summary") as HTMLElement | null)?.focus();
          else if (hadMobileOpen) mobileToggleRef.current?.focus();
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
      <div className={`${styles.topline} ${headerStyles.topline}`}>
        <div className={`shell ${styles.toplineInner} ${headerStyles.toplineInner}`}>
          <span className="ia-header-status"><i aria-hidden="true" />Cổng thông tin điện tử · IAICT</span>
          <span>Institute of Applied Information and Communication Technology</span>
        </div>
      </div>

      <div className={`shell ${styles.brandRow} ${headerStyles.headerRow}`}>
        <Link className={`${styles.brand} ${headerStyles.brand}`} href="/" aria-label="IAICT - Trang chủ" onClick={closeMenus}>
          <span className={`${styles.brandMark} ${headerStyles.brandMark}`} aria-hidden="true">IA</span>
          <span className={headerStyles.brandIdentity}>
            <strong>IAICT</strong>
            <span className={headerStyles.brandVi}>Viện Ứng dụng Công nghệ Thông tin và Truyền thông</span>
            <span className={headerStyles.brandEn}>Institute of Applied Information and Communication Technology</span>
          </span>
        </Link>

        <nav className={styles.desktopNav} aria-label="Điều hướng chính">
          {primaryItems.map((item) => (
            <Link href={item.href} key={item.href} aria-current={current(item.href) ? "page" : undefined} onClick={closeMenus}>{item.label}</Link>
          ))}
          {moreItems.length > 0 ? (
            <details className={styles.dropdown}>
              <summary>Khám phá</summary>
              <div className={styles.dropdownPanel}>
                {moreItems.map((item) => (
                  <Link href={item.href} key={item.href} aria-current={current(item.href) ? "page" : undefined} onClick={closeMenus}>{item.label}</Link>
                ))}
              </div>
            </details>
          ) : null}
          <a href={adminUrl} onClick={closeMenus}>Đăng nhập</a>
        </nav>

        <div className={styles.actions}>
          <Link className={styles.search} href="/tim-kiem" aria-label="Tìm kiếm" onClick={closeMenus}>Tìm kiếm</Link>
          <Link className={styles.cta} href={contactItem.href} onClick={closeMenus}>Liên hệ hợp tác</Link>
          <div className={styles.mobileMenu}>
            <button
              ref={mobileToggleRef}
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
        <div className={`${styles.mobileLayer} ${headerStyles.mobileLayer}`}>
          <button
            className={styles.mobileBackdrop}
            type="button"
            tabIndex={-1}
            aria-label="Đóng điều hướng"
            onClick={() => {
              closeMenus();
              mobileToggleRef.current?.focus();
            }}
          />
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
              <span>{navigation.length + 2} mục</span>
            </div>

            <div className={styles.mobileNavList}>
              {navigation.map((item, index) => (
                <Link
                  className={`${styles.mobileNavItem} ${item.href === contactItem.href ? styles.mobileContact : ""}`}
                  href={item.href}
                  key={`${item.href}-${index}`}
                  aria-current={current(item.href) ? "page" : undefined}
                  onClick={() => setMobileOpen(false)}
                >
                  <span className={styles.mobileNavNo} aria-hidden="true">{String(index + 1).padStart(2, "0")}</span>
                  <span>{item.label}</span>
                  <span className={styles.mobileNavArrow} aria-hidden="true">↗</span>
                </Link>
              ))}
              <a className={styles.mobileNavItem} href={adminUrl} onClick={closeMenus}>
                <span className={styles.mobileNavNo} aria-hidden="true">{String(navigation.length + 1).padStart(2, "0")}</span>
                <span>Đăng nhập</span>
                <span className={styles.mobileNavArrow} aria-hidden="true">↗</span>
              </a>
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
