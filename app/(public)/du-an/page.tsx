import type { Metadata } from "next";
import type { CSSProperties } from "react";
import Link from "next/link";
import styles from "@/components/public-v15.module.css";

export const metadata: Metadata = {
  title: "Dự án tiêu biểu",
  description: "Các mô hình ứng dụng của IAICT được trình bày theo bối cảnh, kiến trúc, bằng chứng và khả năng chuyển giao, nhân rộng.",
};

const projectLenses = [
  ["01", "Field systems", "IoT & dữ liệu hiện trường", "Thiết kế luồng từ cảm biến, gateway và kết nối đến hạ tầng lưu trữ có thể khai thác."],
  ["02", "Data & AI", "Dữ liệu trước, AI sau", "Tổ chức dữ liệu, phân quyền và tiêu chí kiểm chứng trước khi đưa AI vào quy trình nghiệp vụ."],
  ["03", "Traceability", "Truy xuất & vòng đời", "Liên kết dữ liệu theo đối tượng, thời gian và chuỗi tác nghiệp để tạo lịch sử có thể tra cứu."],
  ["04", "Transfer-ready", "Thiết kế để chuyển giao", "Tài liệu, cấu hình, đào tạo và cơ chế vận hành được xem là một phần của giải pháp ngay từ đầu."],
] as const;

const projectFlow = [
  ["01", "Discover", "Làm rõ hiện trạng, dữ liệu, điều kiện hiện trường và tiêu chí thành công.", "Phạm vi & điểm nghẽn"],
  ["02", "Design", "Thiết kế kiến trúc, tích hợp, luồng dữ liệu và phương án vận hành phù hợp.", "Kiến trúc & backlog"],
  ["03", "Prove", "Thử nghiệm bằng PoC hoặc giai đoạn hẹp để có bằng chứng trước khi mở rộng.", "Dữ liệu & đánh giá"],
  ["04", "Transfer & Scale", "Chuẩn hóa cấu hình, tài liệu, đào tạo và lộ trình nhân rộng có kiểm soát.", "Bàn giao & roadmap"],
] as const;

const heroStyle = {
  "--hero-image": "url('https://images.unsplash.com/photo-1783434640967-1e0098a362df?auto=format&fit=crop&fm=jpg&q=84&w=2200')",
} as CSSProperties;

const featureStyle = {
  "--feature-image": "url('https://images.unsplash.com/photo-1764835711461-117d67799a7d?auto=format&fit=crop&fm=jpg&q=84&w=1800')",
} as CSSProperties;

export default function ProjectsPage() {
  return (
    <main id="main-content" className={styles.page}>
      <section className={styles.hero} style={heroStyle}>
        <div className={`shell ${styles.heroInner}`}>
          <nav className={styles.breadcrumb} aria-label="Đường dẫn trang">
            <Link href="/">Trang chủ</Link><span aria-hidden="true">/</span><span aria-current="page">Dự án</span>
          </nav>
          <div className={styles.heroGrid}>
            <div>
              <p className={styles.kicker}>IAICT / PROJECT LAB</p>
              <h1>Dự án như một phòng thí nghiệm triển khai.</h1>
              <p className={styles.lead}>Mỗi dự án được nhìn như một chuỗi từ bối cảnh thực tế, kiến trúc, thử nghiệm và dữ liệu đến khả năng vận hành, chuyển giao và nhân rộng.</p>
              <div className={styles.heroActions}>
                <Link className={styles.primaryAction} href="#spotlight">Khám phá dự án <span>↓</span></Link>
                <Link className={styles.secondaryAction} href="/lien-he">Trao đổi hợp tác ↗</Link>
              </div>
            </div>
            <aside className={styles.heroAside} aria-label="Khung trình bày dự án IAICT">
              <span className={styles.heroAsideLabel}>IAICT / Project Framework</span>
              <div className={styles.signalList}>
                <div className={styles.signal}><span>01</span><div><strong>Context</strong><small>Bài toán thật và điều kiện vận hành.</small></div></div>
                <div className={styles.signal}><span>02</span><div><strong>Architecture</strong><small>Thiết bị · dữ liệu · dịch vụ · ứng dụng.</small></div></div>
                <div className={styles.signal}><span>03</span><div><strong>Evidence</strong><small>Dữ liệu và bằng chứng thử nghiệm.</small></div></div>
                <div className={styles.signal}><span>04</span><div><strong>Scale</strong><small>Chuẩn hóa để chuyển giao và mở rộng.</small></div></div>
              </div>
            </aside>
          </div>
        </div>
      </section>

      <section className={styles.section} id="spotlight">
        <div className="shell">
          <div className={styles.sectionHead}>
            <div><p className={styles.label}>Project Spotlight</p><h2>Trâm Rừng — từ hiện trường đến dữ liệu có thể khai thác.</h2></div>
            <p>Một case study tập trung vào bài toán ngoài trời: thu nhận dữ liệu cảm biến, truyền dẫn linh hoạt, lưu trữ trên server và tạo nền cho truy xuất, giám sát và các lớp ứng dụng tiếp theo.</p>
          </div>
          <article className={styles.feature}>
            <div className={styles.featureMedia} style={featureStyle}>
              <div className={styles.featureStamp}>
                <span>TRÂM RỪNG · IOT · FIELD DATA</span>
                <strong>Từ sensor đến server — giữ luồng dữ liệu liền mạch.</strong>
              </div>
            </div>
            <div className={styles.featureCopy}>
              <p>Trâm Rừng thể hiện cách IAICT nối công nghệ với bối cảnh vận hành thực tế: ưu tiên luồng dữ liệu ổn định, nguồn điện dự phòng, kết nối 4G linh hoạt và hạ tầng server hiện hữu.</p>
              <div className={styles.facts}>
                <div className={styles.fact}><small>Môi trường</small><strong>Ngoài trời · rừng phòng hộ</strong></div>
                <div className={styles.fact}><small>Kết nối</small><strong>4G linh hoạt theo điều kiện</strong></div>
                <div className={styles.fact}><small>Hạ tầng</small><strong>Server + cơ sở dữ liệu</strong></div>
                <div className={styles.fact}><small>Thiết kế</small><strong>UPS · field-ready · modular</strong></div>
              </div>
              <Link className={styles.textLink} href="/du-an/tram-rung">Xem flagship case study Trâm Rừng ↗</Link>
            </div>
          </article>
        </div>
      </section>

      <section className={styles.sectionAlt}>
        <div className="shell">
          <div className={styles.sectionHead}>
            <div><p className={styles.label}>Project Lenses</p><h2>Bốn lớp để một dự án không dừng ở bản demo.</h2></div>
            <p>Trọng tâm không phải tạo cảm giác quy mô bằng các con số chưa được xác minh, mà là cách một mô hình được thiết kế, kiểm chứng và chuẩn bị để đơn vị tiếp nhận có thể vận hành.</p>
          </div>
          <div className={styles.lensGrid}>
            {projectLenses.map(([no, label, title, body]) => (
              <article className={styles.lens} key={title}>
                <span>{no} · {label}</span><h3>{title}</h3><p>{body}</p><small>Evidence-first · Transfer-ready</small>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className={styles.sectionDark}>
        <div className="shell">
          <div className={styles.sectionHead}>
            <div><p className={styles.labelLight}>IAICT / Project Method</p><h2>Từ nhu cầu đến khả năng nhân rộng.</h2></div>
            <p>Một chuỗi triển khai rõ ràng giúp giảm rủi ro và giữ được mối liên hệ giữa bài toán, công nghệ, dữ liệu và năng lực của đơn vị tiếp nhận.</p>
          </div>
          <div className={styles.flowGrid}>
            {projectFlow.map(([no, title, body, meta]) => (
              <article className={styles.flowStep} key={title}><span>{no}</span><h3>{title}</h3><p>{body}</p><small>Đầu ra · {meta}</small></article>
            ))}
          </div>
        </div>
      </section>

      <section className={styles.ctaBand}>
        <div className={`shell ${styles.ctaInner}`}>
          <div><h2>Có một bài toán cần thử nghiệm trong điều kiện thực tế?</h2><p>IAICT có thể cùng đơn vị xác định phạm vi PoC, kiến trúc, tiêu chí đánh giá và lộ trình chuyển từ thử nghiệm sang vận hành.</p></div>
          <Link className={styles.primaryAction} href="/lien-he">Trao đổi dự án <span>↗</span></Link>
        </div>
      </section>
    </main>
  );
}
