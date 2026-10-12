import type { Metadata } from "next";

export const metadata: Metadata = { title: "Liên hệ & Hợp tác" };

export default function ContactPage() {
  return (
    <main id="main-content"><section className="page-hero"><div className="shell page-hero-inner"><p className="kicker">Liên hệ & Hợp tác</p><h1>Bắt đầu từ bài toán cần giải quyết</h1><p className="page-lead">Kênh liên hệ chính thức được thiết kế để tiếp nhận nhu cầu tư vấn, dự án, chuyển giao, đào tạo và hợp tác sau khi luồng form M0 được xác nhận.</p></div></section><section className="section"><div className="shell contact-grid"><article className="contact-card"><span>Đơn vị</span><h2>Viện Ứng dụng Công nghệ Thông tin và Truyền thông</h2><p>Số 7 Tôn Thất Thuyết, phường Cầu Giấy, Hà Nội</p></article><article className="contact-card"><span>Nhóm nhu cầu</span><ul><li>Tư vấn & triển khai</li><li>Chuyển giao công nghệ</li><li>Đào tạo & tập huấn</li><li>Hợp tác dự án</li></ul></article><article className="contact-card contact-card-safe"><span>Trạng thái form</span><h2>Chưa thu dữ liệu cá nhân trước M0</h2><p>Form trực tuyến sẽ chỉ bật khi Turnstile, idempotency, D1, retention và notification outbox đã được kiểm chứng trên staging.</p></article></div></section></main>
  );
}
