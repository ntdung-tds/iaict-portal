import Link from "next/link";
import { mainNavigation } from "@/lib/public-content";
import styles from "./site-chrome.module.css";

const primaryItems = mainNavigation.slice(0, 4);
const moreItems = mainNavigation.slice(4);
const contactItem = mainNavigation[8];

export function SiteHeader() {
  return (
    <header className={styles.header}>
      <div className={styles.topline}>
        <div className={`shell ${styles.toplineInner}`}>
          <span>Cổng thông tin điện tử · IAICT</span>
          <span>Ứng dụng công nghệ · Chuyển giao · Đào tạo</span>
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
            <Link href={item.href} key={item.href}>{item.label}</Link>
          ))}
          <details className={styles.dropdown}>
            <summary>Hoạt động & Hợp tác</summary>
            <div className={styles.dropdownPanel}>
              {moreItems.map((item) => (
                <Link href={item.href} key={item.href}>{item.label}</Link>
              ))}
            </div>
          </details>
        </nav>

        <div className={styles.actions}>
          <Link className={styles.search} href="/tim-kiem" aria-label="Tìm kiếm">Tìm kiếm</Link>
          <Link className={styles.cta} href={contactItem.href}>Liên hệ hợp tác</Link>
          <details className={styles.mobileMenu}>
            <summary aria-label="Mở menu">Menu</summary>
            <nav aria-label="Điều hướng di động">
              {mainNavigation.map((item) => (
                <Link href={item.href} key={item.href}>{item.label}</Link>
              ))}
              <Link href="/tim-kiem">Tìm kiếm</Link>
            </nav>
          </details>
        </div>
      </div>
    </header>
  );
}
