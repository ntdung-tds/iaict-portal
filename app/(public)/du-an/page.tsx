import type { Metadata } from "next";
import Link from "next/link";
import { DataPlaceholder } from "@/components/data-placeholder";
import styles from "@/components/wow/wow.module.css";

export const metadata: Metadata = { title: "Dự án tiêu biểu" };

export default function ProjectsPage() {
  return (
    <main id="main-content">
      <section className="page-hero">
        <div className="shell page-hero-inner">
          <p className="kicker">Dự án tiêu biểu</p>
          <h1>Mô hình ứng dụng và khả năng nhân rộng</h1>
          <p className="page-lead">Dự án được trình bày theo bối cảnh, giải pháp, phạm vi, công nghệ, evidence và khả năng phát triển tiếp.</p>
        </div>
      </section>

      <section className={styles.section}>
        <div className="shell">
          <div className={styles.projectCard}>
            <div className={styles.projectVisual}>TRÂM RỪNG · PROJECT LAB</div>
            <div className={styles.projectInfo}>
              <span className={styles.projectTag}>IoT · Field Data · Traceability</span>
              <h2>Trâm Rừng</h2>
              <p>Case study demo về luồng dữ liệu cảm biến ngoài trời → gateway → 4G → server → database → dashboard và các lớp ứng dụng.</p>
              <Link className="button button-primary" href="/du-an/tram-rung">Xem case study</Link>
            </div>
          </div>
        </div>
      </section>

      <section className={styles.sectionTint}>
        <div className="shell news-placeholder-grid">
          <DataPlaceholder label="CMS / Projects" title="Các dự án tiếp theo sẽ lấy từ CMS" description="Danh sách mở rộng chỉ xuất bản khi có nội dung được biên tập và xác minh." />
          <DataPlaceholder label="Evidence-first" title="Không công bố kết quả chưa xác minh" description="Số liệu, media, đối tác và kết quả phải có nguồn nội bộ được phê duyệt." />
        </div>
      </section>
    </main>
  );
}
