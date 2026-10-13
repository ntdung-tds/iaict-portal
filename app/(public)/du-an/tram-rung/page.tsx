import type { Metadata } from "next";
import Link from "next/link";
import styles from "@/components/wow/wow.module.css";

export const metadata: Metadata = {
  title: "Trâm Rừng — IAICT Project Lab",
  description: "Kiến trúc dữ liệu IoT ngoài trời từ cảm biến đến server, cơ sở dữ liệu và lớp ứng dụng khai thác.",
};

const facts = [
  ["Môi trường", "Ngoài trời"],
  ["Kết nối", "4G linh hoạt"],
  ["Nguồn", "UPS dự phòng"],
  ["Trung tâm dữ liệu", "Server + Database"],
];

const steps = [
  ["01", "Capture", "Cảm biến thu nhận dữ liệu tại hiện trường."],
  ["02", "Validate", "Gateway/edge kiểm tra dữ liệu và trạng thái thiết bị."],
  ["03", "Transport", "Truyền dữ liệu qua kết nối 4G phù hợp điều kiện triển khai."],
  ["04", "Store", "Server tiếp nhận và lưu dữ liệu vào cơ sở dữ liệu."],
  ["05", "Use", "Dữ liệu được khai thác cho giám sát, truy xuất và quản lý vòng đời."],
];

export default function TramRungPage() {
  return (
    <main id="main-content">
      <section className={styles.caseHero}>
        <div className="shell">
          <span className={styles.caseBadge}>IAICT Project Lab · IoT & Field Data</span>
          <p className={styles.label}>Trâm Rừng</p>
          <h1>Kết nối rừng với dữ liệu.</h1>
          <p className={styles.caseLead}>Trâm Rừng được tiếp cận như một hệ thống dữ liệu hiện trường: cảm biến, gateway, kết nối 4G, nguồn dự phòng, server và cơ sở dữ liệu cùng tạo thành một chuỗi vận hành thống nhất.</p>
          <div className={styles.heroActions}>
            <Link className={styles.primaryAction} href="#architecture">Xem kiến trúc</Link>
            <Link className={styles.secondaryAction} href="/du-an">Các dự án</Link>
          </div>
        </div>
      </section>

      <div className={`shell ${styles.factGrid}`}>
        {facts.map(([label, value]) => <div className={styles.fact} key={label}><span>{label}</span><strong>{value}</strong></div>)}
      </div>

      <section className={styles.section} id="architecture" aria-labelledby="architecture-title">
        <div className={`shell ${styles.caseGrid}`}>
          <div className={styles.caseText}>
            <p className={styles.label}>Architecture</p>
            <h2 id="architecture-title">Data-first: dữ liệu phải về được server một cách ổn định và có thể kiểm soát.</h2>
            <p>Kiến trúc được tổ chức theo các lớp rõ ràng để thuận lợi cho lắp đặt, vận hành, thay thế thiết bị và mở rộng về sau.</p>
            <ul>
              <li>Thiết bị ngoài trời được lựa chọn theo điều kiện môi trường và yêu cầu bảo vệ phù hợp.</li>
              <li>4G là phương án kết nối linh hoạt, cho phép điều chỉnh theo chất lượng sóng tại hiện trường.</li>
              <li>UPS hỗ trợ duy trì hoạt động khi nguồn điện không ổn định.</li>
              <li>Server hiện hữu đóng vai trò trung tâm tiếp nhận, lưu trữ và cung cấp dữ liệu cho các lớp ứng dụng.</li>
            </ul>
          </div>
          <div className={styles.caseDiagram}>
            <p className={styles.label}>Operating flow</p>
            <h3>Capture → Validate → Transport → Store → Use</h3>
            <div className={styles.caseFlow}>
              {steps.map(([no, title, body]) => (
                <div className={styles.caseStep} key={no}>
                  <span>{no}</span>
                  <div><strong>{title}</strong><small>{body}</small></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className={styles.sectionTint} aria-labelledby="principles-title">
        <div className="shell">
          <div className={styles.heading}>
            <div><p className={styles.label}>Design principles</p><h2 id="principles-title">Bốn nguyên tắc định hướng hệ thống.</h2></div>
            <p>Thiết kế ưu tiên độ tin cậy của dữ liệu, khả năng vận hành ngoài trời và tính linh hoạt khi mở rộng hoặc thay đổi cấu hình thiết bị.</p>
          </div>
          <div className={styles.problemGrid}>
            <article className={styles.problemCard}><span>01</span><h3>Outdoor-first</h3><p>Thiết bị, nguồn, cột và vỏ bảo vệ được xem xét từ điều kiện hiện trường trước tiên.</p></article>
            <article className={styles.problemCard}><span>02</span><h3>Data-first</h3><p>Ưu tiên dữ liệu đi được về server, có cấu trúc và có thể kiểm tra.</p></article>
            <article className={styles.problemCard}><span>03</span><h3>Modular</h3><p>Cảm biến, gateway, mạng và ứng dụng có thể thay đổi độc lập theo nhu cầu.</p></article>
            <article className={styles.problemCard}><span>04</span><h3>Evidence-first</h3><p>Dữ liệu và kết quả được tổ chức để có thể đối chiếu, theo dõi và bổ sung bằng chứng khi vận hành.</p></article>
          </div>
        </div>
      </section>

      <section className={styles.section} aria-labelledby="layers-title">
        <div className="shell">
          <div className={styles.heading}>
            <div><p className={styles.label}>System layers</p><h2 id="layers-title">Bốn lớp để đi từ hiện trường đến ứng dụng.</h2></div>
            <p>Mỗi lớp có trách nhiệm riêng nhưng liên kết qua một luồng dữ liệu thống nhất, giúp hệ thống dễ giám sát và bảo trì.</p>
          </div>
          <div className={styles.problemGrid}>
            <article className={styles.problemCard}><span>FIELD</span><h3>Thiết bị hiện trường</h3><p>Cảm biến, nguồn, tủ bảo vệ và các thành phần lắp đặt ngoài trời.</p></article>
            <article className={styles.problemCard}><span>CONNECT</span><h3>Kết nối & gateway</h3><p>Gateway tập hợp dữ liệu và truyền về hệ thống qua kết nối 4G phù hợp.</p></article>
            <article className={styles.problemCard}><span>CORE</span><h3>Server & Database</h3><p>Tiếp nhận, lưu trữ, tổ chức dữ liệu và cung cấp các giao diện tích hợp cần thiết.</p></article>
            <article className={styles.problemCard}><span>APPS</span><h3>Khai thác dữ liệu</h3><p>Dashboard, truy xuất nguồn gốc và quản lý vòng đời sử dụng dữ liệu đã được lưu.</p></article>
          </div>
        </div>
      </section>

      <section className={styles.sectionDark} aria-labelledby="data-title">
        <div className="shell">
          <div className={styles.heading}>
            <div><p className={styles.label}>Data continuum</p><h2 id="data-title">Một luồng dữ liệu xuyên suốt từ hiện trường đến lớp khai thác.</h2></div>
            <p>Kiến trúc được giữ độc lập với nhà cung cấp hạ tầng để có thể lựa chọn môi trường triển khai phù hợp với từng giai đoạn.</p>
          </div>
          <div className={styles.architecture}>
            <div className={styles.architectureTop}><div><small>TRÂM RỪNG / DATA FLOW</small><strong>Field systems → Data core → Applications</strong></div><span>IAICT</span></div>
            <div className={styles.flow}>
              <div>Sensor<small>Field data</small></div>
              <div>Gateway<small>Edge layer</small></div>
              <div>4G<small>Transport</small></div>
              <div>Server + DB<small>Data core</small></div>
              <div>Applications<small>Monitoring & traceability</small></div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
