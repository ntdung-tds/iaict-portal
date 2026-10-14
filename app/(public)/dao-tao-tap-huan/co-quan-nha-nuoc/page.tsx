import Link from "next/link";
import type { CSSProperties } from "react";
import type { Metadata } from "next";
import { governmentAudiences } from "@/lib/public-content";
import styles from "@/components/public.module.css";

export const metadata: Metadata = {
  title: "Đào tạo dành cho cơ quan nhà nước",
  description: "Khung đào tạo, tập huấn theo cấp, vị trí việc làm và năng lực cần áp dụng trong môi trường công vụ.",
};

const trainingFlow = [
  ["01", "Role", "Xác định vị trí & nhiệm vụ", "Phân nhóm lãnh đạo, quản lý, chuyên viên và nghiệp vụ để chọn đúng độ sâu nội dung.", "Hồ sơ đối tượng"],
  ["02", "Module", "Thiết kế chương trình", "Ghép chuyên đề theo mục tiêu công việc, lĩnh vực và mức độ sẵn sàng của đơn vị.", "Cấu trúc học phần"],
  ["03", "Practice", "Thực hành theo tình huống", "Dùng hồ sơ, quy trình, dữ liệu và tình huống mô phỏng gần với công việc hằng ngày.", "Bài tập & sản phẩm"],
  ["04", "Evidence", "Đánh giá khả năng áp dụng", "Đánh giá bằng đầu ra thực hành và kế hoạch áp dụng thay vì chỉ kiểm tra ghi nhớ.", "Minh chứng năng lực"],
] as const;

const programBlocks = [
  ["01", "AI & CÔNG VỤ", "AI theo vị trí việc làm", "Sử dụng AI có kiểm soát trong tham mưu, tổng hợp, xử lý văn bản, dữ liệu và hỗ trợ nghiệp vụ."],
  ["02", "DATA", "Dữ liệu & quản trị dữ liệu", "Tư duy dữ liệu, chuẩn hóa, chia sẻ, chất lượng dữ liệu và cách tổ chức dữ liệu phục vụ quản lý."],
  ["03", "LEADERSHIP", "Lãnh đạo & quản trị số", "Ra quyết định, lựa chọn ưu tiên, quản trị thay đổi và theo dõi hiệu quả trong môi trường số."],
  ["04", "DIGITAL SKILLS", "Kỹ năng số theo nghiệp vụ", "Công cụ, quy trình và kỹ năng làm việc số gắn trực tiếp với nhiệm vụ của cán bộ, công chức, viên chức."],
] as const;

const heroStyle = {
  "--hero-image": "url('https://images.unsplash.com/photo-1524178232363-1fb2b075b655?auto=format&fit=crop&fm=jpg&q=84&w=2200')",
} as CSSProperties;

export default function GovernmentTrainingPage() {
  return (
    <main id="main-content" className={styles.page}>
      <section className={styles.hero} style={heroStyle}>
        <div className={`shell ${styles.heroInner}`}>
          <nav className={styles.breadcrumb} aria-label="Đường dẫn trang">
            <Link href="/">Trang chủ</Link><span aria-hidden="true">/</span><Link href="/dao-tao-tap-huan">Đào tạo & Tập huấn</Link><span aria-hidden="true">/</span><span aria-current="page">Cơ quan nhà nước</span>
          </nav>
          <div className={styles.heroGrid}>
            <div>
              <p className={styles.kicker}>IAICT ACADEMY / PUBLIC SECTOR</p>
              <h1>Đào tạo để áp dụng được vào công việc.</h1>
              <p className={styles.lead}>Chương trình được thiết kế theo cấp, vị trí việc làm và năng lực cần dùng thật; nội dung có thể ghép linh hoạt từ AI, dữ liệu, chuyển đổi số đến quản trị và kỹ năng số.</p>
              <div className={styles.heroActions}>
                <a className={styles.primaryAction} href="#audiences">Xem nhóm đối tượng <span>↓</span></a>
                <Link className={styles.secondaryAction} href="/lien-he">Trao đổi chương trình ↗</Link>
              </div>
            </div>
            <aside className={styles.heroAside} aria-label="Khung đào tạo IAICT cho cơ quan nhà nước">
              <span className={styles.heroAsideLabel}>IAICT Academy / Learning Framework</span>
              <div className={styles.signalList}>
                <div className={styles.signal}><span>01</span><div><strong>Đúng đối tượng</strong><small>Theo cấp, vai trò và nhóm nghiệp vụ.</small></div></div>
                <div className={styles.signal}><span>02</span><div><strong>Đúng năng lực</strong><small>Gắn với việc cần làm sau khóa học.</small></div></div>
                <div className={styles.signal}><span>03</span><div><strong>Có thực hành</strong><small>Tình huống gần với môi trường công vụ.</small></div></div>
                <div className={styles.signal}><span>04</span><div><strong>Có đầu ra</strong><small>Đánh giá bằng sản phẩm và khả năng áp dụng.</small></div></div>
              </div>
            </aside>
          </div>
        </div>
      </section>

      <section className={styles.section} id="audiences">
        <div className="shell">
          <div className={styles.sectionHead}>
            <div><p className={styles.label}>Audience Architecture</p><h2>Không dùng một chương trình cho mọi nhóm người học.</h2></div>
            <p>Mỗi nhóm có vai trò, mức độ ra quyết định và nhu cầu sử dụng công nghệ khác nhau; cấu trúc nội dung vì vậy cần được phân tầng ngay từ đầu.</p>
          </div>
          <div className={styles.newsGrid}>
            {governmentAudiences.map((item, index) => (
              <article className={styles.newsCard} key={item.title}>
                <span>{String(index + 1).padStart(2, "0")} · ROLE-BASED</span>
                <h3>{item.title}</h3>
                <p>{item.summary}</p>
                <small>Audience · Outcome · Practice</small>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className={styles.sectionDark}>
        <div className="shell">
          <div className={styles.sectionHead}>
            <div><p className={styles.labelLight}>IAICT Academy / Design Flow</p><h2>Từ vị trí việc làm đến bằng chứng năng lực.</h2></div>
            <p>Khung này giúp lớp học đi từ “học công cụ” sang “làm được nhiệm vụ”, đồng thời dễ điều chỉnh theo lĩnh vực, địa bàn và thời lượng.</p>
          </div>
          <div className={styles.flowGrid}>
            {trainingFlow.map(([no, label, title, body, output]) => (
              <article className={styles.flowStep} key={label}>
                <span>{no}</span><h3>{title}</h3><p>{body}</p><small>{label} · {output}</small>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className={styles.sectionAlt}>
        <div className="shell">
          <div className={styles.sectionHead}>
            <div><p className={styles.label}>Program Design</p><h2>Một chương trình có thể ghép linh hoạt theo nhu cầu đơn vị.</h2></div>
            <p>Thay vì khóa cứng theo tên công nghệ, chương trình có thể tổ chức theo năng lực và tình huống công việc để dễ cập nhật khi công cụ thay đổi.</p>
          </div>
          <div className={styles.lensGrid}>
            {programBlocks.map(([no, label, title, body]) => (
              <article className={styles.lens} key={title}>
                <span>{no} · {label}</span><h3>{title}</h3><p>{body}</p><small>Role · Task · Practice · Evidence</small>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className={styles.ctaBand}>
        <div className={`shell ${styles.ctaInner}`}>
          <div><h2>Cần xây dựng chương trình riêng cho cơ quan hoặc địa phương?</h2><p>IAICT có thể cùng đơn vị khảo sát đối tượng, mục tiêu, thời lượng và tình huống thực tế để thiết kế chương trình phù hợp.</p></div>
          <Link className={styles.primaryAction} href="/lien-he">Trao đổi nhu cầu đào tạo <span>↗</span></Link>
        </div>
      </section>
    </main>
  );
}
