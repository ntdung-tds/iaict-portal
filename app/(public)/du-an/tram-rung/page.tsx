import type { Metadata } from "next";
import type { CSSProperties } from "react";
import Link from "next/link";
import styles from "@/components/public-v15.module.css";

export const metadata: Metadata = {
  title: "Trâm Rừng — IAICT Project Lab",
  description: "Kiến trúc dữ liệu IoT ngoài trời từ cảm biến đến server, cơ sở dữ liệu và lớp ứng dụng khai thác.",
};

const facts = [
  ["Môi trường", "Ngoài trời"],
  ["Kết nối", "4G linh hoạt"],
  ["Nguồn", "UPS dự phòng"],
  ["Trung tâm dữ liệu", "Server + Database"],
] as const;

const steps = [
  ["01", "Capture", "Cảm biến thu nhận dữ liệu tại hiện trường."],
  ["02", "Validate", "Gateway/edge kiểm tra dữ liệu và trạng thái thiết bị."],
  ["03", "Transport", "Truyền dữ liệu qua kết nối 4G phù hợp điều kiện triển khai."],
  ["04", "Store", "Server tiếp nhận và lưu dữ liệu vào cơ sở dữ liệu."],
  ["05", "Use", "Dữ liệu được khai thác cho giám sát, truy xuất và quản lý vòng đời."],
] as const;

const principles = [
  ["01", "Outdoor-first", "Thiết bị, nguồn, cột và vỏ bảo vệ được xem xét từ điều kiện hiện trường trước tiên."],
  ["02", "Data-first", "Ưu tiên dữ liệu đi được về server, có cấu trúc và có thể kiểm tra."],
  ["03", "Modular", "Cảm biến, gateway, mạng và ứng dụng có thể thay đổi độc lập theo nhu cầu."],
  ["04", "Evidence-first", "Dữ liệu và kết quả được tổ chức để có thể đối chiếu, theo dõi và bổ sung bằng chứng khi vận hành."],
] as const;

const heroStyle = {
  "--hero-image": "url('https://images.unsplash.com/photo-1783434640967-1e0098a362df?auto=format&fit=crop&fm=jpg&q=86&w=2400')",
} as CSSProperties;

const architectureStyle = {
  "--architecture-image": "url('https://images.unsplash.com/photo-1764835711461-117d67799a7d?auto=format&fit=crop&fm=jpg&q=84&w=1800')",
} as CSSProperties;

export default function TramRungPage() {
  return (
    <main id="main-content" className={styles.page}>
      <section className={styles.hero} style={heroStyle}>
        <div className={`shell ${styles.heroInner}`}>
          <nav className={styles.breadcrumb} aria-label="Đường dẫn trang">
            <Link href="/">Trang chủ</Link><span aria-hidden="true">/</span><Link href="/du-an">Dự án</Link><span aria-hidden="true">/</span><span aria-current="page">Trâm Rừng</span>
          </nav>
          <div className={styles.heroGrid}>
            <div>
              <p className={styles.kicker}>IAICT Project Lab · IoT & Field Data</p>
              <h1>Kết nối rừng với dữ liệu.</h1>
              <p className={styles.lead}>Trâm Rừng được tiếp cận như một hệ thống dữ liệu hiện trường: cảm biến, gateway, kết nối 4G, nguồn dự phòng, server và cơ sở dữ liệu cùng tạo thành một chuỗi vận hành thống nhất.</p>
              <div className={styles.heroActions}>
                <a className={styles.primaryAction} href="#architecture">Xem kiến trúc <span>↓</span></a>
                <Link className={styles.secondaryAction} href="/du-an">Các dự án ↗</Link>
              </div>
            </div>
            <aside className={styles.heroAside} aria-label="Mục tiêu kỹ thuật dự án Trâm Rừng">
              <span className={styles.heroAsideLabel}>TRÂM RỪNG / FIELD PRIORITIES</span>
              <div className={styles.signalList}>
                <div className={styles.signal}><span>01</span><div><strong>Field-ready</strong><small>Thiết kế cho môi trường triển khai ngoài trời.</small></div></div>
                <div className={styles.signal}><span>02</span><div><strong>Reliable data</strong><small>Ưu tiên đưa dữ liệu cảm biến về server ổn định.</small></div></div>
                <div className={styles.signal}><span>03</span><div><strong>Flexible network</strong><small>4G được cấu hình linh hoạt theo điều kiện hiện trường.</small></div></div>
                <div className={styles.signal}><span>04</span><div><strong>Transfer-ready</strong><small>Cấu trúc rõ lớp để dễ vận hành và mở rộng.</small></div></div>
              </div>
            </aside>
          </div>
        </div>
      </section>

      <div className={`shell ${styles.factBar}`}>
        <div className={styles.factBarInner}>
          {facts.map(([label, value]) => <div className={styles.factBarItem} key={label}><span>{label}</span><strong>{value}</strong></div>)}
        </div>
      </div>

      <section className={styles.section} id="architecture" aria-labelledby="architecture-title">
        <div className={`shell ${styles.architectureGrid}`}>
          <div className={styles.architecturePhoto} style={architectureStyle} aria-hidden="true">
            <div className={styles.architecturePhotoCopy}>
              <span>Field → Core → Applications</span>
              <strong>Một luồng dữ liệu xuyên suốt từ hiện trường tới lớp khai thác.</strong>
            </div>
          </div>
          <div className={styles.architecturePanel}>
            <p className={styles.label}>Architecture</p>
            <h2 id="architecture-title">Data-first: dữ liệu phải về được server ổn định và có thể kiểm soát.</h2>
            <p>Kiến trúc được tổ chức theo các lớp rõ ràng để thuận lợi cho lắp đặt, vận hành, thay thế thiết bị và mở rộng về sau.</p>
            <ul className={styles.bulletList}>
              <li>Thiết bị ngoài trời được lựa chọn theo điều kiện môi trường và yêu cầu bảo vệ phù hợp.</li>
              <li>4G là phương án kết nối linh hoạt, có thể điều chỉnh theo chất lượng sóng tại hiện trường.</li>
              <li>UPS hỗ trợ duy trì hoạt động khi nguồn điện không ổn định.</li>
              <li>Server hiện hữu đóng vai trò trung tâm tiếp nhận, lưu trữ và cung cấp dữ liệu cho các lớp ứng dụng.</li>
            </ul>
            <div className={styles.pipeline} aria-label="Luồng vận hành dữ liệu">
              {steps.map(([no, title, body]) => <div className={styles.pipelineRow} key={no}><span>{no}</span><strong>{title}</strong><small>{body}</small></div>)}
            </div>
          </div>
        </div>
      </section>

      <section className={styles.sectionAlt} aria-labelledby="principles-title">
        <div className="shell">
          <div className={styles.sectionHead}>
            <div><p className={styles.label}>Design Principles</p><h2 id="principles-title">Bốn nguyên tắc định hướng hệ thống.</h2></div>
            <p>Thiết kế ưu tiên độ tin cậy của dữ liệu, khả năng vận hành ngoài trời và tính linh hoạt khi mở rộng hoặc thay đổi cấu hình thiết bị.</p>
          </div>
          <div className={styles.principleGrid}>
            {principles.map(([no, title, body]) => <article className={styles.principle} key={title}><span>{no}</span><h3>{title}</h3><p>{body}</p></article>)}
          </div>
        </div>
      </section>

      <section className={styles.sectionDark} aria-labelledby="data-title">
        <div className="shell">
          <div className={styles.sectionHead}>
            <div><p className={styles.labelLight}>Data Continuum</p><h2 id="data-title">Từ sensor đến ứng dụng — mỗi lớp có trách nhiệm rõ ràng.</h2></div>
            <p>Kiến trúc được giữ mô-đun để có thể lựa chọn thiết bị, kết nối và môi trường triển khai phù hợp theo từng giai đoạn mà không phải thay toàn bộ hệ thống.</p>
          </div>
          <div className={styles.systemBoard}>
            <div className={styles.systemTop}><div><small>TRÂM RỪNG / DATA FLOW</small><strong>Field systems → Data core → Applications</strong></div><span>IAICT</span></div>
            <div className={styles.systemFlow}>
              <div>Sensor<small>Field data</small></div>
              <div>Gateway<small>Edge layer</small></div>
              <div>4G<small>Transport</small></div>
              <div>Server + DB<small>Data core</small></div>
              <div>Applications<small>Monitoring & traceability</small></div>
            </div>
            <p className={styles.evidenceNote}>Mô hình trình bày tập trung vào kiến trúc và nguyên tắc vận hành; các chỉ số hiệu năng hoặc kết quả đo chỉ nên công bố khi có dữ liệu nghiệm thu đã được xác minh.</p>
          </div>
        </div>
      </section>

      <section className={styles.ctaBand}>
        <div className={`shell ${styles.ctaInner}`}>
          <div><h2>Cần xây dựng một hệ thống IoT hiện trường tương tự?</h2><p>IAICT có thể cùng đơn vị xác định thiết bị, luồng dữ liệu, kết nối, hạ tầng server và phạm vi thử nghiệm phù hợp điều kiện thực tế.</p></div>
          <Link className={styles.primaryAction} href="/lien-he">Trao đổi dự án <span>↗</span></Link>
        </div>
      </section>
    </main>
  );
}
