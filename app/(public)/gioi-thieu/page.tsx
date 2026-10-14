import type { Metadata } from "next";
import Link from "next/link";
import { pillars } from "@/lib/public-content";
import styles from "@/components/institutional.module.css";

export const metadata: Metadata = {
  title: "Giới thiệu",
  description: "Giới thiệu IAICT — kết nối nghiên cứu ứng dụng, công nghệ, giải pháp, chuyển giao và đào tạo.",
};

const principles = [
  ["01", "Problem-first", "Bắt đầu từ bài toán", "Làm rõ mục tiêu, quy trình, dữ liệu và điều kiện vận hành trước khi lựa chọn công nghệ."],
  ["02", "Evidence-first", "Kiểm chứng trước khi mở rộng", "Ưu tiên PoC, thử nghiệm và tiêu chí đánh giá để giảm rủi ro trước khi nhân rộng."],
  ["03", "Transfer-ready", "Thiết kế để chuyển giao", "Giải pháp cần có tài liệu, cấu hình, quy trình và năng lực để đơn vị tiếp nhận có thể làm chủ."],
  ["04", "Scale-ready", "Sẵn sàng cho vận hành lâu dài", "Kiến trúc và dữ liệu được tổ chức để có thể tích hợp, mở rộng và tiếp tục phát triển."],
] as const;

export default function AboutPage() {
  return (
    <main id="main-content" data-page="about">
      <section className={styles.hero}>
        <div className={`shell ${styles.heroInner}`}>
          <div>
            <p className={styles.eyebrow}>About IAICT</p>
            <h1>Từ nghiên cứu ứng dụng đến năng lực triển khai.</h1>
            <p className={styles.heroLead}>IAICT kết nối công nghệ, bài toán thực tế, quá trình thử nghiệm, chuyển giao và đào tạo trong một chuỗi giá trị thống nhất — để giải pháp không dừng ở ý tưởng hay bản demo.</p>
          </div>
          <aside className={styles.heroPanel} aria-label="Chuỗi giá trị IAICT">
            <span className={styles.heroPanelLabel}>IAICT / Applied Technology Chain</span>
            <div className={styles.signalList}>
              <div className={styles.signalRow}><span>01</span><div><strong>Technology</strong><small>Nền tảng, AI, dữ liệu, IoT và phần mềm.</small></div></div>
              <div className={styles.signalRow}><span>02</span><div><strong>Solutions</strong><small>Biến năng lực công nghệ thành giải pháp theo bài toán.</small></div></div>
              <div className={styles.signalRow}><span>03</span><div><strong>Transfer</strong><small>Thử nghiệm, hoàn thiện, bàn giao và hỗ trợ làm chủ.</small></div></div>
              <div className={styles.signalRow}><span>04</span><div><strong>Academy</strong><small>Phát triển năng lực sử dụng và vận hành công nghệ.</small></div></div>
            </div>
          </aside>
        </div>
      </section>

      <section className={styles.section}>
        <div className="shell">
          <div className={styles.sectionHead}>
            <div><p className={styles.label}>IAICT Ecosystem</p><h2>Một hệ sinh thái. Bốn năng lực liên kết.</h2></div>
            <p>Mỗi trụ cột có thể hoạt động độc lập, nhưng giá trị lớn nhất xuất hiện khi công nghệ, giải pháp, chuyển giao và đào tạo được thiết kế thành một hành trình liền mạch.</p>
          </div>
          <div className={styles.cardGrid4}>
            {pillars.map((pillar, index) => (
              <article className={styles.card} key={pillar.title}>
                <span className={styles.cardNo}>{String(index + 1).padStart(2, "0")}</span>
                <span className={styles.cardLabel}>IAICT Capability</span>
                <h3>{pillar.title}</h3>
                <p>{pillar.summary}</p>
                <div className={styles.cardMeta}>{index === 0 ? "Nền tảng công nghệ" : index === 1 ? "Thiết kế & triển khai" : index === 2 ? "Thử nghiệm & làm chủ" : "Năng lực con người"}</div>
                <Link className={styles.cardLink} href={pillar.href ?? "/"}>Khám phá năng lực ↗</Link>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className={styles.sectionAlt}>
        <div className="shell">
          <div className={styles.sectionHead}>
            <div><p className={styles.label}>Working Principles</p><h2>Cách IAICT tiếp cận một bài toán công nghệ.</h2></div>
            <p>Không bắt đầu bằng danh sách công nghệ. Bắt đầu bằng vấn đề cần giải quyết, dữ liệu có thể sử dụng, điều kiện vận hành và khả năng tiếp nhận của tổ chức.</p>
          </div>
          <div className={styles.principleGrid}>
            {principles.map(([no, label, title, body]) => (
              <article className={styles.principle} key={title}>
                <span>{no} / {label}</span>
                <h3>{title}</h3>
                <p>{body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className={styles.sectionDark}>
        <div className="shell">
          <div className={styles.sectionHead}>
            <div><p className={styles.labelLight}>From capability to adoption</p><h2>Từ công nghệ đến khả năng làm chủ.</h2></div>
            <p>Một giải pháp chỉ thực sự có giá trị khi đi qua được toàn bộ chuỗi: có nền tảng phù hợp, giải quyết đúng bài toán, được kiểm chứng và được người tiếp nhận vận hành được.</p>
          </div>
          <div className={styles.valueChain}>
            <article className={styles.valueItem}><span>01</span><h3>Công nghệ</h3><p>Lựa chọn nền tảng, dữ liệu và kiến trúc phù hợp điều kiện thực tế.</p><small>Technology</small></article>
            <article className={styles.valueItem}><span>02</span><h3>Giải pháp</h3><p>Gắn công nghệ với quy trình, mục tiêu và cách đo hiệu quả triển khai.</p><small>Solutions</small></article>
            <article className={styles.valueItem}><span>03</span><h3>Chuyển giao</h3><p>Chuẩn hóa cấu hình, tài liệu, đào tạo và cơ chế hỗ trợ sau bàn giao.</p><small>Transfer</small></article>
            <article className={styles.valueItem}><span>04</span><h3>Năng lực</h3><p>Giúp tổ chức tiếp nhận, vận hành, đánh giá và tiếp tục phát triển hệ thống.</p><small>Academy</small></article>
          </div>
        </div>
      </section>

      <section className={styles.ctaBand}>
        <div className={`shell ${styles.ctaInner}`}>
          <div><h2>Có một bài toán cần cùng phân tích?</h2><p>IAICT có thể bắt đầu từ nhu cầu, hiện trạng và mục tiêu thay vì yêu cầu anh/chị phải có sẵn một phương án công nghệ.</p></div>
          <Link className={styles.ctaLink} href="/lien-he">Liên hệ & Hợp tác ↗</Link>
        </div>
      </section>
    </main>
  );
}
