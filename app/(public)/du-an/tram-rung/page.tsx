import type { Metadata } from "next";
import Link from "next/link";
import styles from "@/components/wow/wow.module.css";

export const metadata: Metadata = {
  title: "Trâm Rừng — IAICT Project Lab",
  description: "Case study demo về luồng dữ liệu IoT ngoài trời từ cảm biến đến server, cơ sở dữ liệu và ứng dụng khai thác.",
};

const facts = [
  ["Môi trường", "Ngoài trời"],
  ["Kết nối", "4G linh hoạt"],
  ["Nguồn", "Có UPS dự phòng"],
  ["Trung tâm dữ liệu", "Server + Database"],
];

const steps = [
  ["01", "Capture", "Cảm biến thu dữ liệu tại hiện trường."],
  ["02", "Validate", "Gateway/edge kiểm tra dữ liệu và trạng thái thiết bị."],
  ["03", "Transport", "Truyền dữ liệu qua 4G khi điều kiện hiện trường cho phép."],
  ["04", "Store", "Server tiếp nhận và lưu dữ liệu vào cơ sở dữ liệu."],
  ["05", "Use", "Dashboard, truy xuất và quản lý vòng đời khai thác dữ liệu đã lưu."],
];

export default function TramRungPage() {
  return (
    <main id="main-content">
      <section className={styles.caseHero}>
        <div className="shell">
          <span className={styles.caseBadge}>IAICT Project Lab · Demo case study</span>
          <p className={styles.label}>Trâm Rừng</p>
          <h1>Kết nối rừng với dữ liệu.</h1>
          <p className={styles.caseLead}>Case study trình bày cách dữ liệu cảm biến ngoài trời có thể đi qua gateway, kết nối 4G, server và cơ sở dữ liệu để trở thành thông tin có thể giám sát, truy xuất và khai thác.</p>
          <div className={styles.heroActions}>
            <Link className={styles.primaryAction} href="#architecture">Xem kiến trúc</Link>
            <Link className={styles.secondaryAction} href="/du-an">Quay lại Dự án</Link>
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
            <h2 id="architecture-title">Data-first: mục tiêu là lấy được dữ liệu tin cậy về server.</h2>
            <p>Thiết kế ưu tiên chuỗi dữ liệu đơn giản, dễ kiểm soát và có thể thay thế từng lớp khi điều kiện triển khai thay đổi.</p>
            <ul>
              <li>Thiết bị ngoài trời cần cấu hình phù hợp môi trường và vỏ bảo vệ cao.</li>
              <li>4G là phương án kết nối linh hoạt, không khóa hệ thống vào một nhà mạng hay một cấu hình duy nhất.</li>
              <li>UPS hỗ trợ duy trì hoạt động khi nguồn không ổn định.</li>
              <li>Server hiện hữu đóng vai trò trung tâm tiếp nhận và lưu trữ dữ liệu.</li>
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
            <div><p className={styles.label}>Design principles</p><h2 id="principles-title">Bốn nguyên tắc để demo gần với triển khai thật.</h2></div>
            <p>Không gắn số liệu giả thành dữ liệu thực và không biến case study thành hồ sơ kỹ thuật chính thức.</p>
          </div>
          <div className={styles.problemGrid}>
            <article className={styles.problemCard}><span>01</span><h3>Outdoor-first</h3><p>Thiết bị, nguồn và vỏ được xem xét từ điều kiện hiện trường trước khi tối ưu giao diện.</p></article>
            <article className={styles.problemCard}><span>02</span><h3>Data-first</h3><p>Ưu tiên dữ liệu đi được về server, có cấu trúc và có thể kiểm tra.</p></article>
            <article className={styles.problemCard}><span>03</span><h3>Modular</h3><p>Cảm biến, gateway, mạng và ứng dụng có thể thay đổi độc lập theo nhu cầu.</p></article>
            <article className={styles.problemCard}><span>04</span><h3>Evidence-first</h3><p>Kết quả thật chỉ hiển thị khi có dữ liệu, media hoặc bằng chứng đã được xác minh.</p></article>
          </div>
        </div>
      </section>

      <section className={styles.section} id="dashboard-preview" aria-labelledby="dashboard-title">
        <div className="shell">
          <div className={styles.heading}>
            <div><p className={styles.label}>IoT Dashboard Preview</p><h2 id="dashboard-title">Trải nghiệm dashboard trước khi có API sensor thật.</h2></div>
            <p>Các trạng thái dưới đây là dữ liệu mô phỏng để khách hàng duyệt UX. Chúng không đại diện cho dữ liệu đo ngoài hiện trường.</p>
          </div>
          <div className={styles.demoPanel}>
            <div className={styles.demoHeader}><h3>Trạm mô phỏng · Trâm Rừng</h3><span>DEMO DATA</span></div>
            <div className={styles.telemetry}>
              <div><span>Gateway</span><strong>Online</strong><small>Mô phỏng trạng thái</small></div>
              <div><span>Kết nối</span><strong>4G ổn định</strong><small>Mô phỏng trạng thái</small></div>
              <div><span>Nguồn dự phòng</span><strong>UPS sẵn sàng</strong><small>Mô phỏng trạng thái</small></div>
              <div><span>Sensor input</span><strong>Đang nhận</strong><small>Không phải dữ liệu thực</small></div>
              <div><span>Server</span><strong>Connected</strong><small>Mô phỏng kết nối</small></div>
              <div><span>Database</span><strong>Ready</strong><small>Mô phỏng lưu trữ</small></div>
            </div>
          </div>
        </div>
      </section>

      <section className={styles.sectionDark} aria-labelledby="next-title">
        <div className="shell">
          <div className={styles.heading}>
            <div><p className={styles.label}>Next layer</p><h2 id="next-title">Khi có API thật, chỉ thay lớp dữ liệu.</h2></div>
            <p>Giao diện dashboard có thể giữ nguyên; DemoIoTProvider được thay bằng RealIoTProvider để đọc dữ liệu từ server của dự án.</p>
          </div>
          <div className={styles.architecture}>
            <div className={styles.architectureTop}><span>PROVIDER-NEUTRAL</span><small>Không khóa Vercel/Cloudflare</small></div>
            <div className={styles.flow}>
              <div>Dashboard<small>UI</small></div>
              <div>IoT Service<small>Interface</small></div>
              <div>Provider<small>Demo / Real</small></div>
              <div>API<small>Server</small></div>
              <div>Database<small>Sensor data</small></div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
