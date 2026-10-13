import Link from "next/link";
import { mainNavigation } from "@/lib/public-content";

const primaryItems = mainNavigation.slice(1, 4);
const moreItems = mainNavigation.slice(4, 8);
const contactItem = mainNavigation[8];

export function SiteHeader() {
  return (
    <header className="site-header premium-header">
      <div className="topline premium-topline">
        <div className="shell topline-inner">
          <span className="topline-signature">IAICT — Nghiên cứu ứng dụng vì giá trị thực tiễn</span>
          <span className="topline-focus">Công nghệ <i /> Chuyển giao <i /> Đào tạo</span>
        </div>
      </div>

      <div className="shell brand-row premium-brand-row">
        <Link className="brand premium-brand" href="/" aria-label="IAICT - Trang chủ">
          <span className="brand-mark premium-brand-mark" aria-hidden="true">
            <span>IA</span>
          </span>
          <span className="brand-copy">
            <strong>IAICT</strong>
            <small>Viện Ứng dụng Công nghệ Thông tin và Truyền thông</small>
          </span>
        </Link>

        <nav className="desktop-nav premium-nav" aria-label="Điều hướng chính">
          {primaryItems.map((item) => (
            <Link href={item.href} key={item.href}>{item.label}</Link>
          ))}
          <details className="nav-dropdown">
            <summary>Hoạt động & Hợp tác</summary>
            <div className="nav-dropdown-panel premium-dropdown-panel">
              {moreItems.map((item) => (
                <Link href={item.href} key={item.href}>{item.label}</Link>
              ))}
            </div>
          </details>
        </nav>

        <div className="header-actions premium-header-actions">
          <Link className="search-link premium-search-link" href="/tim-kiem" aria-label="Tìm kiếm">
            <span aria-hidden="true">⌕</span> Tìm kiếm
          </Link>
          <Link className="header-cta premium-header-cta" href={contactItem.href}>
            Trao đổi nhu cầu <span aria-hidden="true">↗</span>
          </Link>
          <details className="mobile-menu premium-mobile-menu">
            <summary aria-label="Mở menu"><span aria-hidden="true">☰</span> Menu</summary>
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
