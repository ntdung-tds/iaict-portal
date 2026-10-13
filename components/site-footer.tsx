import Link from "next/link";
import { mainNavigation, pillars } from "@/lib/public-content";

export function SiteFooter() {
  return (
    <footer className="site-footer premium-site-footer">
      <div className="shell footer-grid">
        <div className="footer-identity">
          <div className="footer-identity-mark" aria-hidden="true">IA</div>
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
          <span className="footer-label">Kết nối</span>
          <div className="footer-links">
            <Link href="/tin-tuc">Tin tức & Sự kiện</Link>
            <Link href="/du-an">Dự án tiêu biểu</Link>
            <Link href="/tim-kiem">Tìm kiếm</Link>
            <Link href="/lien-he">Liên hệ & Hợp tác</Link>
          </div>
        </div>
      </div>
      <div className="shell footer-bottom premium-footer-bottom">
        <span>© {new Date().getFullYear()} IAICT. Viện Ứng dụng Công nghệ Thông tin và Truyền thông.</span>
        <span>Công nghệ • Giải pháp • Chuyển giao • Đào tạo</span>
      </div>
    </footer>
  );
}
