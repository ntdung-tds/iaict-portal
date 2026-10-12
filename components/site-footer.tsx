import Link from "next/link";
import { mainNavigation, pillars } from "@/lib/public-content";

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="shell footer-grid">
        <div>
          <strong className="footer-brand">IAICT</strong>
          <p>Viện Ứng dụng Công nghệ Thông tin và Truyền thông</p>
          <p className="footer-muted">Số 7 Tôn Thất Thuyết, phường Cầu Giấy, Hà Nội</p>
        </div>
        <div>
          <span className="footer-label">Bốn trụ cột</span>
          <div className="footer-links">
            {pillars.map((item) => <Link href={item.href ?? "/"} key={item.title}>{item.title}</Link>)}
          </div>
        </div>
        <div>
          <span className="footer-label">Điều hướng</span>
          <div className="footer-links">
            {mainNavigation.slice(1).map((item) => <Link href={item.href} key={item.href}>{item.label}</Link>)}
          </div>
        </div>
        <div>
          <span className="footer-label">Hệ thống</span>
          <div className="footer-links">
            <Link href="/api/health">API Health</Link>
            <Link href="/tim-kiem">Tìm kiếm</Link>
          </div>
        </div>
      </div>
      <div className="shell footer-bottom">© {new Date().getFullYear()} IAICT. Nội dung nghiệp vụ đang được kết nối với CMS.</div>
    </footer>
  );
}
