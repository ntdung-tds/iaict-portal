import Link from "next/link";
import { pillars } from "@/lib/public-content";
import { getPublicSiteSettings } from "@/lib/public-site-settings";
import styles from "./site-chrome.module.css";

export async function SiteFooter() {
  const settings = await getPublicSiteSettings();
  return (
    <footer className={`${styles.footer} ia-footer`}>
      <div className={`shell ${styles.footerTop}`}>
        <div>
          <div className={styles.footerBrand}>
            <span className={styles.footerBrandMark} aria-hidden="true">IA</span>
            <strong>IAICT</strong>
          </div>
          <div className="ia-footer-institute">
            <strong>{settings.organizationName}</strong>
            <span>Institute of Applied Information and Communication Technology</span>
          </div>
          <p className={styles.footerIntro}>{settings.siteDescription || "Kết nối công nghệ, giải pháp, chuyển giao và đào tạo trong một hệ sinh thái ứng dụng thống nhất."}</p>
          {settings.address ? <p className={styles.address}>{settings.address}</p> : <p className={styles.address}>Số 7 Tôn Thất Thuyết, phường Cầu Giấy, Hà Nội</p>}
          {(settings.contactEmail || settings.contactPhone) ? (
            <p className={styles.address}>
              {settings.contactPhone ? <a href={`tel:${settings.contactPhone.replace(/\s+/g, "")}`}>{settings.contactPhone}</a> : null}
              {settings.contactPhone && settings.contactEmail ? " · " : null}
              {settings.contactEmail ? <a href={`mailto:${settings.contactEmail}`}>{settings.contactEmail}</a> : null}
            </p>
          ) : null}
          <div className="ia-footer-signature"><i aria-hidden="true" /><span>Applied Technology · Real-world Value</span></div>
        </div>

        <div>
          <span className={styles.footerLabel}>IAICT Ecosystem</span>
          <div className={styles.footerLinks}>
            {pillars.map((item) => <Link href={item.href ?? "/"} key={item.title}>{item.title}</Link>)}
          </div>
        </div>

        <div>
          <span className={styles.footerLabel}>Về IAICT</span>
          <div className={styles.footerLinks}>
            <Link href="/gioi-thieu">Giới thiệu Viện</Link>
            <Link href="/du-an">Dự án tiêu biểu</Link>
            <Link href="/tin-tuc">Tin tức & Tri thức</Link>
            <Link href="/lien-he">Liên hệ & Hợp tác</Link>
          </div>
        </div>

        <div>
          <span className={styles.footerLabel}>Khám phá</span>
          <div className={styles.footerLinks}>
            <Link href="/giai-phap-dich-vu">Giải pháp & Dịch vụ</Link>
            <Link href="/san-pham-nen-tang">Sản phẩm & Nền tảng</Link>
            <Link href="/chuyen-giao-cong-nghe">Chuyển giao công nghệ</Link>
            <Link href="/dao-tao-tap-huan">Đào tạo & Tập huấn</Link>
            <Link href="/tim-kiem">Tìm kiếm</Link>
          </div>
        </div>
      </div>

      <div className={`shell ${styles.footerBottom}`}>
        <span>© {new Date().getFullYear()} IAICT</span>
        <span>Technology · Solutions · Transfer · Academy</span>
      </div>
    </footer>
  );
}
