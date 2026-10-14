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

const architectureBullets = [
  "Thiết bị ngoài trời được lựa chọn theo điều kiện môi trường và yêu cầu bảo vệ phù hợp.",
  "4G là phương án kết nối linh hoạt, có thể điều chỉnh theo chất lượng sóng tại hiện trường.",
  "UPS hỗ trợ duy trì hoạt động khi nguồn điện không ổn định.",
  "Server hiện hữu đóng vai trò trung tâm tiếp nhận, lưu trữ và cung cấp dữ liệu cho các lớp ứng dụng.",
] as const;

const heroStyle = {
  "--hero-image": "url('https://images.unsplash.com/photo-1783434640967-1e0098a362df?auto=format&fit=crop&fm=jpg&q=86&w=2400')",
} as CSSProperties;

const architectureStyle = {
  "--architecture-image": "url('https://images.unsplash.com/photo-1764835711461-117d67799a7d?auto=format&fit=crop&fm=jpg&q=84&w=1800')",
} as CSSProperties;

const tramResponsiveCss = `
[data-tram-architecture-mobile]{display:none}
@media (max-width:768px){
  [data-tram-architecture-desktop]{display:none!important}
  [data-tram-architecture-mobile]{display:block!important;width:min(100% - 28px,1180px)!important;min-width:0!important;max-width:100%!important;margin-inline:auto!important}
  [data-tram-mobile-photo]{position:relative;width:100%!important;min-width:0!important;min-height:360px;border-radius:22px;overflow:hidden;background-image:linear-gradient(180deg,rgba(3,42,45,.04),rgba(3,42,45,.78)),var(--architecture-image);background-size:cover;background-position:center}
  [data-tram-mobile-copy]{position:absolute;left:22px!important;right:22px!important;bottom:22px;width:auto!important;min-width:0!important;max-width:calc(100% - 44px)!important;color:#fff}
  [data-tram-mobile-copy] span{display:block;color:#86e4cd;font-size:9px;font-weight:900;letter-spacing:.12em;text-transform:uppercase;overflow-wrap:anywhere}
  [data-tram-mobile-copy] strong{display:block;max-width:100%!important;margin-top:8px;font-size:28px;line-height:1.04;letter-spacing:-.035em;overflow-wrap:anywhere}
  [data-tram-mobile-panel]{width:100%!important;min-width:0!important;max-width:100%!important;margin-top:18px;padding:26px;border:1px solid #d9e5e2;border-radius:22px;background:#fff;box-sizing:border-box!important}
  [data-tram-mobile-panel] h2{margin:0;color:#0d3139;font-size:32px;line-height:1.05;letter-spacing:-.04em;overflow-wrap:anywhere}
  [data-tram-mobile-panel]>p{margin:16px 0 0;color:#627a80;font-size:13.5px;line-height:1.75}
  [data-tram-mobile-list]{margin:22px 0 0;padding:0;list-style:none;border-top:1px solid #d9e4e1}
  [data-tram-mobile-list] li{position:relative;padding:13px 0 13px 20px;border-bottom:1px solid #d9e4e1;color:#4f6d73;font-size:12px;line-height:1.6;overflow-wrap:anywhere}
  [data-tram-mobile-list] li:before{content:"";position:absolute;left:0;top:19px;width:6px;height:6px;border-radius:50%;background:#0a8b81}
  [data-tram-mobile-pipeline]{margin-top:24px;border-top:1px solid #d6e2df}
  [data-tram-mobile-row]{display:grid!important;width:100%!important;min-width:0!important;grid-template-columns:30px minmax(58px,78px) minmax(0,1fr)!important;gap:8px!important;padding:13px 0;border-bottom:1px solid #d6e2df;box-sizing:border-box!important}
  [data-tram-mobile-row]>*{min-width:0!important;max-width:100%!important;overflow-wrap:anywhere!important}
  [data-tram-mobile-row]>span{color:#0a887f;font-size:10px;font-weight:900}
  [data-tram-mobile-row]>strong{color:#173a42;font-size:11.5px}
  [data-tram-mobile-row]>small{color:#70868a;font-size:10.5px;line-height:1.5}
}
@media (max-width:360px){
  [data-tram-architecture-mobile]{width:calc(100% - 20px)!important}
  [data-tram-mobile-photo]{min-height:330px}
  [data-tram-mobile-copy]{left:18px!important;right:18px!important;max-width:calc(100% - 36px)!important}
  [data-tram-mobile-copy] strong{font-size:25px}
  [data-tram-mobile-panel]{padding:20px}
  [data-tram-mobile-panel] h2{font-size:28px}
  [data-tram-mobile-row]{grid-template-columns:26px minmax(54px,68px) minmax(0,1fr)!important;gap:6px!important}
}
`;

function ArchitecturePanelContent({ mobile = false }: { mobile?: boolean }) {
  if (mobile) {
    return (
      <div data-tram-mobile-panel>
        <p className={styles.label}>Architecture</p>
        <h2>Data-first: dữ liệu phải về được server ổn định và có thể kiểm soát.</h2>
        <p>Kiến trúc được tổ chức theo các lớp rõ ràng để thuận lợi cho lắp đặt, vận hành, thay thế thiết bị và mở rộng về sau.</p>
        <ul data-tram-mobile-list>
          {architectureBullets.map((item) => <li key={item}>{item}</li>)}
        </ul>
        <div data-tram-mobile-pipeline aria-label="Luồng vận hành dữ liệu trên thiết bị di động">
          {steps.map(([no, title, body]) => <div data-tram-mobile-row key={no}><span>{no}</span><strong>{title}</strong><small>{body}</small></div>)}
        </div>
      </div>
    );
  }

  return (
    <div className={styles.architecturePanel}>
      <p className={styles.label}>Architecture</p>
      <h2 id="architecture-title">Data-first: dữ liệu phải về được server ổn định và có thể kiểm soát.</h2>
      <p>Kiến trúc được tổ chức theo các lớp rõ ràng để thuận lợi cho lắp đặt, vận hành, thay thế thiết bị và mở rộng về sau.</p>
      <ul className={styles.bulletList}>
        {architectureBullets.map((item) => <li key={item}>{item}</li>)}
      </ul>
      <div className={styles.pipeline} aria-label="Luồng vận hành dữ liệu">
        {steps.map(([no, title, body]) => <div className={styles.pipelineRow} key={no}><span>{no}</span><strong>{title}</strong><small>{body}</small></div>)}
      </div>
    </div>
  );
}

export default function TramRungPage() {
  return (
    <main id="main-content" className={styles.page}>
      <style>{tramResponsiveCss}</style>
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
        <div className={`shell ${styles.architectureGrid}`} data-tram-architecture-desktop>
          <div className={styles.architecturePhoto} style={architectureStyle} aria-hidden="true">
            <div className={styles.architecturePhotoCopy}>
              <span>Field → Core → Applications</span>
              <strong>Một luồng dữ liệu xuyên suốt từ hiện trường tới lớp khai thác.</strong>
            </div>
          </div>
          <ArchitecturePanelContent />
        </div>

        <div data-tram-architecture-mobile>
          <div data-tram-mobile-photo style={architectureStyle} aria-hidden="true">
            <div data-tram-mobile-copy>
              <span>Field → Core → Applications</span>
              <strong>Một luồng dữ liệu xuyên suốt từ hiện trường tới lớp khai thác.</strong>
            </div>
          </div>
          <ArchitecturePanelContent mobile />
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
