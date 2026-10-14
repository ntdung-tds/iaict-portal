import Link from "next/link";
import type { CSSProperties } from "react";
import type { Metadata } from "next";
import { PublicSearch } from "@/components/public-search";
import styles from "@/components/public.module.css";

export const metadata: Metadata = {
  title: "Tìm kiếm",
  description: "Tìm kiếm nội dung IAICT theo từ khóa, năng lực, dự án và nhóm chủ đề.",
};

const quickPaths = [
  ["01", "Sản phẩm & Nền tảng", "IoT, AI, dữ liệu, truy xuất, quản lý vòng đời và các nền tảng ứng dụng.", "/san-pham-nen-tang"],
  ["02", "Giải pháp & Dịch vụ", "Tư vấn, thiết kế, tích hợp, triển khai và hỗ trợ vận hành theo bài toán.", "/giai-phap-dich-vu"],
  ["03", "Chuyển giao công nghệ", "Từ khảo sát, thử nghiệm đến chuẩn hóa, đào tạo và làm chủ giải pháp.", "/chuyen-giao-cong-nghe"],
  ["04", "Đào tạo & Tập huấn", "Chương trình theo đối tượng, vị trí việc làm, mục tiêu và hình thức tổ chức.", "/dao-tao-tap-huan"],
  ["05", "Dự án tiêu biểu", "Case study và mô hình ứng dụng được trình bày theo bối cảnh, kiến trúc và bằng chứng.", "/du-an"],
  ["06", "Tin tức & Tri thức", "Thông tin hoạt động, tri thức ứng dụng, sự kiện và các chủ đề công nghệ liên quan.", "/tin-tuc"],
] as const;

const heroStyle = {
  "--hero-image": "url('https://images.unsplash.com/photo-1768224656445-33d078c250b7?auto=format&fit=crop&fm=jpg&q=84&w=2200')",
} as CSSProperties;

export default function SearchPage() {
  return (
    <main id="main-content" className={styles.page}>
      <section className={styles.hero} style={heroStyle}>
        <div className={`shell ${styles.heroInner}`}>
          <nav className={styles.breadcrumb} aria-label="Đường dẫn trang">
            <Link href="/">Trang chủ</Link><span aria-hidden="true">/</span><span aria-current="page">Tìm kiếm</span>
          </nav>
          <div className={styles.heroGrid}>
            <div>
              <p className={styles.kicker}>IAICT / DISCOVERY HUB</p>
              <h1>Tìm đúng năng lực, không chỉ tìm từ khóa.</h1>
              <p className={styles.lead}>Tìm sản phẩm, giải pháp, dự án và chương trình đào tạo trong nội dung IAICT đang công khai. Có thể bắt đầu bằng từ khóa, nhu cầu hoặc nhóm năng lực.</p>
              <div className={styles.heroActions}>
                <a className={styles.primaryAction} href="#search-hub">Bắt đầu tìm kiếm <span>↓</span></a>
                <Link className={styles.secondaryAction} href="/lien-he">Trao đổi nhu cầu ↗</Link>
              </div>
            </div>
            <aside className={styles.heroAside} aria-label="Các cách khám phá nội dung IAICT">
              <span className={styles.heroAsideLabel}>IAICT / Discovery Framework</span>
              <div className={styles.signalList}>
                <div className={styles.signal}><span>01</span><div><strong>Theo nhu cầu</strong><small>Bắt đầu từ bài toán cần giải quyết.</small></div></div>
                <div className={styles.signal}><span>02</span><div><strong>Theo năng lực</strong><small>Công nghệ · giải pháp · chuyển giao.</small></div></div>
                <div className={styles.signal}><span>03</span><div><strong>Theo dự án</strong><small>Xem mô hình ứng dụng và kiến trúc.</small></div></div>
                <div className={styles.signal}><span>04</span><div><strong>Theo tri thức</strong><small>Tin tức, hoạt động và chuyên đề.</small></div></div>
              </div>
            </aside>
          </div>
        </div>
      </section>

      <section className={styles.section} id="search-hub">
        <div className="shell">
          <div className={styles.sectionHead}>
            <div><p className={styles.label}>Discovery Hub</p><h2>Bạn đang tìm nội dung nào?</h2></div>
            <p>Tìm theo tên, mô tả hoặc từ khóa không dấu; sau đó lọc nhanh theo công nghệ, giải pháp, đào tạo, dự án, tri thức hoặc thông tin về Viện.</p>
          </div>
          <PublicSearch />
        </div>
      </section>

      <section className={styles.sectionAlt}>
        <div className="shell">
          <div className={styles.sectionHead}>
            <div><p className={styles.label}>Explore by Path</p><h2>Không cần biết chính xác tên nội dung.</h2></div>
            <p>Nếu từ khóa chưa đủ rõ, có thể đi trực tiếp vào nhóm năng lực hoặc bắt đầu từ dự án, tri thức ứng dụng và nhu cầu hợp tác.</p>
          </div>
          <div className={styles.newsGrid}>
            {quickPaths.slice(0, 3).map(([no, title, body, href]) => (
              <article className={styles.newsCard} key={title}>
                <span>{no} · IAICT</span><h3>{title}</h3><p>{body}</p><small><Link href={href}>Khám phá nội dung ↗</Link></small>
              </article>
            ))}
          </div>
          <div className={styles.newsGrid} style={{ marginTop: 16 }}>
            {quickPaths.slice(3).map(([no, title, body, href]) => (
              <article className={styles.newsCard} key={title}>
                <span>{no} · IAICT</span><h3>{title}</h3><p>{body}</p><small><Link href={href}>Khám phá nội dung ↗</Link></small>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className={styles.ctaBand}>
        <div className={`shell ${styles.ctaInner}`}>
          <div><h2>Không chắc nên bắt đầu từ đâu?</h2><p>Mô tả ngắn bài toán, bối cảnh và kết quả mong muốn; IAICT sẽ định hướng nhóm năng lực phù hợp để trao đổi tiếp.</p></div>
          <Link className={styles.primaryAction} href="/lien-he">Bắt đầu từ nhu cầu <span>↗</span></Link>
        </div>
      </section>
    </main>
  );
}
