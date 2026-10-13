import type { Metadata } from "next";
import Link from "next/link";

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

export default function ProjectsPage() {
  return (
    <main id="main-content" className="v9-page">
      <section className="v9-hero">
        <div className="shell v9-hero-grid">
          <div>
            <p className="v9-kicker">IAICT / PROJECT LAB</p>
            <h1>Dự án như một phòng thí nghiệm triển khai.</h1>
            <p className="v9-lead">Mỗi dự án được nhìn như một chuỗi từ bối cảnh thực tế, kiến trúc, thử nghiệm và dữ liệu đến khả năng vận hành, chuyển giao và nhân rộng.</p>
          </div>
          <aside className="v9-signal" aria-label="Khung trình bày dự án IAICT">
            <div><small>CONTEXT</small><strong>Bài toán thật</strong><span>Điều kiện hiện trường và nhu cầu vận hành.</span></div>
            <div><small>ARCHITECTURE</small><strong>Hệ thống rõ lớp</strong><span>Thiết bị · dữ liệu · dịch vụ · ứng dụng.</span></div>
            <div><small>EVIDENCE</small><strong>Kiểm chứng được</strong><span>Ưu tiên dữ liệu và bằng chứng thử nghiệm.</span></div>
            <div><small>SCALE</small><strong>Có thể nhân rộng</strong><span>Chuẩn hóa để chuyển giao và mở rộng.</span></div>
          </aside>
        </div>
      </section>

      <section className="v9-section">
        <div className="shell">
          <div className="v9-section-head">
            <div><p className="v9-kicker">PROJECT SPOTLIGHT</p><h2>Trâm Rừng — từ rừng phòng hộ đến dữ liệu có thể khai thác.</h2></div>
            <p>Một case study tập trung vào bài toán ngoài trời: thu nhận dữ liệu cảm biến, truyền dẫn linh hoạt, lưu trữ trên server và tạo nền cho truy xuất, giám sát và các lớp ứng dụng tiếp theo.</p>
          </div>

          <article className="v9-feature">
            <div className="v9-feature-visual">
              <span>TRÂM RỪNG · IOT · FIELD DATA</span>
              <h2>Từ sensor đến server — không mất dấu dữ liệu giữa đường.</h2>
              <p>Kiến trúc được tổ chức theo hướng data-first, field-ready và có thể thay thế từng lớp khi điều kiện kết nối hoặc thiết bị thay đổi.</p>
            </div>
            <div className="v9-feature-copy">
              <p>Trâm Rừng là ví dụ rõ cho cách IAICT nối công nghệ với bối cảnh vận hành thực tế: ưu tiên luồng dữ liệu ổn định, nguồn điện dự phòng, kết nối 4G linh hoạt và hạ tầng server sẵn có.</p>
              <div className="v9-facts">
                <div><small>Môi trường</small><strong>Ngoài trời · rừng phòng hộ</strong></div>
                <div><small>Kết nối</small><strong>4G linh hoạt theo điều kiện</strong></div>
                <div><small>Hạ tầng</small><strong>Server + cơ sở dữ liệu</strong></div>
                <div><small>Thiết kế</small><strong>UPS · field-ready · modular</strong></div>
              </div>
              <Link className="v9-action" href="/du-an/tram-rung">Xem case study Trâm Rừng <span>↗</span></Link>
            </div>
          </article>
        </div>
      </section>

      <section className="v9-section-alt">
        <div className="shell">
          <div className="v9-section-head">
            <div><p className="v9-kicker">PROJECT LENSES</p><h2>Bốn lớp để một dự án không dừng ở bản demo.</h2></div>
            <p>IAICT không dùng số lượng dự án hay chỉ số thành tích chưa được xác minh để tạo cảm giác quy mô; trọng tâm là cách một mô hình được thiết kế và kiểm chứng.</p>
          </div>
          <div className="v9-grid-4">
            {projectLenses.map(([no, label, title, body]) => (
              <article className="v9-card" key={title}><span>{no} · {label}</span><h3>{title}</h3><p>{body}</p><small>Evidence-first · Transfer-ready</small></article>
            ))}
          </div>
        </div>
      </section>

      <section className="v9-section-dark">
        <div className="shell">
          <div className="v9-section-head">
            <div><p className="v9-kicker" style={{ color: "#72dfc8" }}>IAICT / PROJECT METHOD</p><h2>Từ nhu cầu đến khả năng nhân rộng.</h2></div>
            <p>Một chuỗi triển khai rõ ràng giúp giảm rủi ro và giữ được mối liên hệ giữa bài toán, công nghệ và năng lực của đơn vị tiếp nhận.</p>
          </div>
          <div className="v9-flow">
            <article><span>01</span><h3>Discover</h3><p>Làm rõ hiện trạng, dữ liệu, điều kiện hiện trường và tiêu chí thành công.</p><small>Đầu ra · phạm vi & điểm nghẽn</small></article>
            <article><span>02</span><h3>Design</h3><p>Thiết kế kiến trúc, tích hợp, luồng dữ liệu và phương án vận hành phù hợp.</p><small>Đầu ra · kiến trúc & backlog</small></article>
            <article><span>03</span><h3>Prove</h3><p>Thử nghiệm bằng PoC hoặc giai đoạn hẹp để có bằng chứng trước khi mở rộng.</p><small>Đầu ra · dữ liệu & đánh giá</small></article>
            <article><span>04</span><h3>Transfer & Scale</h3><p>Chuẩn hóa cấu hình, tài liệu, đào tạo và lộ trình nhân rộng có kiểm soát.</p><small>Đầu ra · bàn giao & roadmap</small></article>
          </div>
        </div>
      </section>

      <section className="v9-cta"><div className="shell v9-cta-inner"><div><h2>Có một bài toán cần thử nghiệm trong điều kiện thực tế?</h2><p>IAICT có thể cùng đơn vị xác định phạm vi PoC, kiến trúc, tiêu chí đánh giá và lộ trình chuyển từ thử nghiệm sang vận hành.</p></div><Link href="/lien-he">Trao đổi dự án <span>↗</span></Link></div></section>
    </main>
  );
}
