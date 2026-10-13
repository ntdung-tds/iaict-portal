import type { Metadata } from "next";
import Link from "next/link";
import styles from "@/components/institutional-v8.module.css";

export const metadata: Metadata = {
  title: "Liên hệ & Hợp tác",
  description: "Liên hệ IAICT về tư vấn, triển khai, chuyển giao công nghệ, đào tạo và hợp tác dự án.",
};

const topics = [
  ["01", "Tư vấn & triển khai", "Làm rõ bài toán, hiện trạng, phạm vi và hướng triển khai phù hợp."],
  ["02", "Chuyển giao công nghệ", "Trao đổi về thử nghiệm, hoàn thiện, bàn giao và hỗ trợ làm chủ giải pháp."],
  ["03", "Đào tạo & tập huấn", "Thiết kế chương trình theo đối tượng, nhiệm vụ và năng lực cần hình thành."],
  ["04", "Hợp tác dự án", "Phối hợp nghiên cứu ứng dụng, PoC, triển khai thực tế và nhân rộng mô hình."],
] as const;

export default function ContactPage() {
  return (
    <main id="main-content">
      <section className={styles.hero}>
        <div className={`shell ${styles.heroInner}`}>
          <div>
            <p className={styles.eyebrow}>Collaborate with IAICT</p>
            <h1>Bắt đầu từ bài toán cần giải quyết.</h1>
            <p className={styles.heroLead}>Không cần chuẩn bị sẵn một danh sách công nghệ. Chỉ cần mô tả bối cảnh, vấn đề đang gặp, mục tiêu và điều kiện triển khai; IAICT sẽ cùng phân tích để xác định hướng tiếp cận phù hợp.</p>
          </div>
          <aside className={styles.heroPanel} aria-label="Các hướng hợp tác với IAICT">
            <span className={styles.heroPanelLabel}>IAICT / Collaboration Scope</span>
            <div className={styles.signalList}>
              <div className={styles.signalRow}><span>01</span><div><strong>Consult</strong><small>Khảo sát và định hình phương án.</small></div></div>
              <div className={styles.signalRow}><span>02</span><div><strong>Build</strong><small>Thiết kế, thử nghiệm và triển khai.</small></div></div>
              <div className={styles.signalRow}><span>03</span><div><strong>Transfer</strong><small>Chuẩn hóa, bàn giao và hỗ trợ làm chủ.</small></div></div>
              <div className={styles.signalRow}><span>04</span><div><strong>Train</strong><small>Đào tạo theo vai trò và nhiệm vụ thực tế.</small></div></div>
            </div>
          </aside>
        </div>
      </section>

      <section className={styles.section}>
        <div className="shell">
          <div className={styles.sectionHead}>
            <div><p className={styles.label}>Contact & Partnership</p><h2>Chọn đúng hướng trao đổi ngay từ đầu.</h2></div>
            <p>IAICT tổ chức nhu cầu hợp tác theo bốn nhóm để việc tiếp nhận và phản hồi tập trung hơn. Một nhu cầu có thể đi qua nhiều nhóm nếu dự án cần cả công nghệ, chuyển giao và đào tạo.</p>
          </div>
          <div className={styles.contactGrid}>
            <article className={styles.contactPrimary}>
              <p className={styles.labelLight}>Đơn vị đầu mối</p>
              <h2>Viện Ứng dụng Công nghệ Thông tin và Truyền thông</h2>
              <p>Trao đổi về nhu cầu công nghệ, dữ liệu, AI, IoT, chuyển đổi số, chuyển giao, đào tạo hoặc hợp tác triển khai.</p>
              <div className={styles.addressBox}>
                <span>Địa chỉ</span>
                <strong>Số 7 Tôn Thất Thuyết, phường Cầu Giấy, Hà Nội</strong>
              </div>
            </article>
            <div className={styles.contactTopics}>
              {topics.map(([no, title, body]) => (
                <article className={styles.contactTopic} key={title}>
                  <span>{no} / IAICT</span>
                  <h3>{title}</h3>
                  <p>{body}</p>
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className={styles.sectionAlt}>
        <div className="shell">
          <div className={styles.sectionHead}>
            <div><p className={styles.label}>Start a conversation</p><h2>Một quy trình trao đổi ngắn, đủ để đi đúng hướng.</h2></div>
            <p>Ở bước đầu, thông tin cần nhất là bối cảnh, nhu cầu và tiêu chí thành công. Chi tiết kỹ thuật có thể được làm rõ dần trong quá trình trao đổi.</p>
          </div>
          <div className={styles.process}>
            <article className={styles.processStep}><span>01</span><h3>Bối cảnh</h3><p>Mô tả tổ chức, quy trình, hệ thống hoặc hiện trường đang cần cải thiện.</p></article>
            <article className={styles.processStep}><span>02</span><h3>Nhu cầu</h3><p>Nêu vấn đề ưu tiên, mục tiêu mong muốn và giới hạn cần lưu ý.</p></article>
            <article className={styles.processStep}><span>03</span><h3>Trao đổi</h3><p>Cùng làm rõ dữ liệu, công nghệ, nguồn lực, phạm vi và tiêu chí đánh giá.</p></article>
            <article className={styles.processStep}><span>04</span><h3>Đề xuất</h3><p>Thống nhất hướng tiếp cận, bước thử nghiệm hoặc phương án triển khai tiếp theo.</p></article>
          </div>
          <div className={styles.safeNote}>Kênh liên hệ trực tuyến được triển khai theo nguyên tắc chỉ thu thập dữ liệu khi luồng tiếp nhận và bảo vệ dữ liệu đã được kiểm chứng. Trong thời gian hoàn thiện, thông tin liên hệ chính thức của Viện vẫn là đầu mối trao đổi.</div>
        </div>
      </section>

      <section className={styles.ctaBand}>
        <div className={`shell ${styles.ctaInner}`}>
          <div><h2>Muốn hiểu trước năng lực của IAICT?</h2><p>Xem hệ sinh thái công nghệ, giải pháp, chuyển giao và đào tạo trước khi bắt đầu một cuộc trao đổi cụ thể.</p></div>
          <Link className={styles.ctaLink} href="/gioi-thieu">Giới thiệu IAICT ↗</Link>
        </div>
      </section>
    </main>
  );
}
