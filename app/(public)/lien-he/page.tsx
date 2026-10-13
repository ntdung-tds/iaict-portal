import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Liên hệ & Hợp tác" };

const inquiryTypes = [
  { number: "01", title: "Tư vấn & triển khai", text: "Trao đổi nhu cầu chuyển đổi số, nền tảng, dữ liệu, AI, IoT và tích hợp hệ thống." },
  { number: "02", title: "Chuyển giao công nghệ", text: "Hợp tác thử nghiệm, hoàn thiện, tiếp nhận và làm chủ giải pháp công nghệ." },
  { number: "03", title: "Đào tạo & tập huấn", text: "Xây dựng chương trình theo đối tượng, mục tiêu, lĩnh vực và nhu cầu thực tế." },
  { number: "04", title: "Hợp tác dự án", text: "Trao đổi mô hình nghiên cứu ứng dụng, triển khai thử nghiệm và đồng hành dài hạn." },
];

const prepItems = [
  "Bài toán hoặc nhu cầu cần giải quyết",
  "Đối tượng sử dụng và phạm vi dự kiến",
  "Hạ tầng, dữ liệu hoặc hệ thống hiện có",
  "Mốc thời gian hoặc kết quả mong muốn",
];

export default function ContactPage() {
  return (
    <main id="main-content" className="contact-page">
      <section className="contact-hero">
        <div className="contact-hero-grid" aria-hidden="true" />
        <div className="shell contact-hero-inner">
          <div>
            <div className="contact-breadcrumb"><Link href="/">IAICT</Link><span>/</span><b>Liên hệ</b></div>
            <p className="kicker">Liên hệ & Hợp tác</p>
            <h1>Bắt đầu từ bài toán cần giải quyết</h1>
            <p className="page-lead">IAICT tiếp nhận nhu cầu theo hướng làm rõ mục tiêu, bối cảnh và điều kiện triển khai trước khi đề xuất công nghệ hoặc phạm vi công việc.</p>
          </div>
          <aside className="contact-address-card">
            <span>IAICT Office</span>
            <strong>Viện Ứng dụng Công nghệ Thông tin và Truyền thông</strong>
            <p>Số 7 Tôn Thất Thuyết, phường Cầu Giấy, Hà Nội</p>
            <div className="contact-address-status"><i aria-hidden="true" />Kênh tiếp nhận trực tiếp tại Viện</div>
          </aside>
        </div>
      </section>

      <section className="section contact-needs-section">
        <div className="shell">
          <div className="contact-section-heading">
            <div><p className="kicker">Nhóm nhu cầu</p><h2>Bạn muốn trao đổi về nội dung nào?</h2></div>
            <p>Chọn nhóm gần nhất với nhu cầu hiện tại. Khi làm việc, IAICT sẽ tiếp tục bóc tách phạm vi và đề xuất hướng tiếp cận phù hợp.</p>
          </div>
          <div className="contact-needs-grid">
            {inquiryTypes.map((item) => (
              <article key={item.number}>
                <span>{item.number}</span>
                <h3>{item.title}</h3>
                <p>{item.text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="section contact-prep-section">
        <div className="shell contact-prep-grid">
          <div>
            <p className="kicker kicker-light">Chuẩn bị trước khi trao đổi</p>
            <h2>Chỉ cần bốn thông tin cơ bản để bắt đầu</h2>
            <p>Không cần chuẩn bị tài liệu kỹ thuật hoàn chỉnh. Một mô tả ngắn về nhu cầu và hiện trạng đã đủ để bắt đầu buổi trao đổi đầu tiên.</p>
          </div>
          <div className="contact-prep-list">
            {prepItems.map((item, index) => (
              <div key={item}><span>{String(index + 1).padStart(2, "0")}</span><strong>{item}</strong></div>
            ))}
          </div>
        </div>
      </section>

      <section className="section contact-channel-section">
        <div className="shell contact-channel-grid">
          <div className="contact-channel-card primary">
            <span>Trao đổi trực tiếp</span>
            <h2>Làm việc cùng IAICT tại Hà Nội</h2>
            <p>Địa chỉ: Số 7 Tôn Thất Thuyết, phường Cầu Giấy, Hà Nội.</p>
            <b>Phù hợp với nhu cầu tư vấn, hợp tác dự án và làm việc chuyên môn.</b>
          </div>
          <div className="contact-channel-card secondary">
            <span>Kênh trực tuyến</span>
            <h2>Biểu mẫu tiếp nhận điện tử</h2>
            <p>Kênh trực tuyến sẽ được mở khi quy trình tiếp nhận và phản hồi được hoàn thiện để bảo đảm thông tin gửi đến được xử lý đúng đầu mối.</p>
            <b>Trong thời gian này, vui lòng ưu tiên kênh làm việc trực tiếp với Viện.</b>
          </div>
        </div>
      </section>

      <section className="section section-compact contact-final-section">
        <div className="shell contact-final-card">
          <div><p className="kicker kicker-light">Khám phá trước khi liên hệ</p><h2>Xem năng lực và mô hình triển khai của IAICT</h2></div>
          <div className="contact-final-actions">
            <Link className="button button-light" href="/giai-phap-dich-vu">Giải pháp & Dịch vụ</Link>
            <Link className="contact-final-link" href="/du-an">Dự án tiêu biểu →</Link>
          </div>
        </div>
      </section>
    </main>
  );
}
