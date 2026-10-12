import Link from "next/link";
import { mainNavigation } from "@/lib/public-content";

const primaryItems = mainNavigation.slice(0, 4);
const moreItems = mainNavigation.slice(4);
const contactItem = mainNavigation[8];

export function SiteHeader() {
  return (
    <header className="site-header">
      <div className="topline">
        <div className="shell topline-inner">
          <span>Cổng thông tin điện tử IAICT</span>
          <span className="status-dot">Hệ thống đang hoàn thiện M0</span>
        </div>
      </div>
      <div className="shell brand-row">
        <Link className="brand" href="/" aria-label="IAICT - Trang chủ">
          <span className="brand-mark" aria-hidden="true">IA</span>
          <span>
            <strong>IAICT</strong>
            <small>Viện Ứng dụng Công nghệ Thông tin và Truyền thông</small>
          </span>
        </Link>

        <nav className="desktop-nav" aria-label="Điều hướng chính">
          {primaryItems.map((item) => (
            <Link href={item.href} key={item.href}>{item.label}</Link>
          ))}
          <details className="nav-dropdown">
            <summary>Hoạt động & Hợp tác</summary>
            <div className="nav-dropdown-panel">
              {moreItems.map((item) => (
                <Link href={item.href} key={item.href}>{item.label}</Link>
              ))}
            </div>
          </details>
        </nav>

        <div className="header-actions">
          <Link className="search-link" href="/tim-kiem" aria-label="Tìm kiếm">Tìm kiếm</Link>
          <Link className="header-cta" href={contactItem.href}>Đề nghị tư vấn</Link>
          <details className="mobile-menu">
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
