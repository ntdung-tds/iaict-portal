import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Dự án tiêu biểu" };

const projectLayers = [
  { number: "01", title: "Hiện trường", detail: "Thiết bị, cảm biến và dữ liệu thực địa" },
  { number: "02", title: "Kết nối", detail: "Gateway, 4G và truyền dữ liệu" },
  { number: "03", title: "Dữ liệu", detail: "Máy chủ, cơ sở dữ liệu và lưu trữ" },
  { number: "04", title: "Ứng dụng", detail: "Quản lý, truy xuất và khai thác thông tin" },
];

const projectPrinciples = [
  "Thiết kế cho điều kiện triển khai ngoài thực địa",
  "Tận dụng hạ tầng máy chủ sẵn có khi phù hợp",
  "Tách rõ lớp thiết bị, kết nối, dữ liệu và ứng dụng",
  "Có thể mở rộng thêm cảm biến, nghiệp vụ và mô-đun theo nhu cầu",
];

export default function ProjectsPage() {
  return (
    <main id="main-content" className="projects-page">
      <section className="projects-hero">
        <div className="projects-hero-grid" aria-hidden="true" />
        <div className="shell projects-hero-inner">
          <div>
            <div className="projects-breadcrumb"><Link href="/">IAICT</Link><span>/</span><b>Dự án</b></div>
            <p className="kicker">Dự án tiêu biểu</p>
            <h1>Mô hình ứng dụng và khả năng nhân rộng</h1>
            <p className="page-lead">Mỗi dự án được nhìn như một hệ thống hoàn chỉnh: bối cảnh, công nghệ, triển khai, dữ liệu, vận hành và khả năng mở rộng sau giai đoạn đầu.</p>
          </div>
          <aside className="projects-hero-note">
            <span>Project philosophy</span>
            <strong>Evidence before claims.</strong>
            <p>Ưu tiên mô tả phạm vi, kiến trúc và kết quả có thể kiểm chứng; không sử dụng số liệu hoặc thành tích chưa được xác nhận.</p>
          </aside>
        </div>
      </section>

      <section className="section featured-project-detail" aria-labelledby="tram-rung-title">
        <div className="shell featured-project-detail-grid">
          <div className="featured-project-detail-copy">
            <div className="project-tagline"><span>01</span><b>Applied IoT • Data • Traceability</b></div>
            <p className="kicker">Trâm Rừng</p>
            <h2 id="tram-rung-title">Từ dữ liệu hiện trường đến nền tảng quản lý số</h2>
            <p>Dự án Trâm Rừng là mô hình ứng dụng tại khu vực rừng phòng hộ, tập trung vào việc thu nhận dữ liệu từ hiện trường, truyền dữ liệu về máy chủ, tổ chức lưu trữ và khai thác trên nền tảng quản lý.</p>
            <p>Kiến trúc được tổ chức theo lớp để thuận lợi cho triển khai, bảo trì và mở rộng — từ thiết bị cảm biến, kết nối 4G đến cơ sở dữ liệu, truy xuất nguồn gốc và quản lý vòng đời.</p>
            <div className="project-principles">
              {projectPrinciples.map((item) => <span key={item}><i aria-hidden="true">✓</i>{item}</span>)}
            </div>
            <div className="hero-actions">
              <Link className="button button-primary" href="/lien-he">Trao đổi mô hình tương tự</Link>
              <Link className="project-secondary-link" href="/san-pham-nen-tang#iot-quan-trac">Xem năng lực IoT →</Link>
            </div>
          </div>

          <div className="project-architecture-card" aria-label="Kiến trúc tổng quan dự án Trâm Rừng">
            <div className="architecture-header">
              <span>System architecture</span>
              <strong>Field → Network → Data → Application</strong>
            </div>
            <div className="architecture-flow">
              {projectLayers.map((item, index) => (
                <div className="architecture-layer" key={item.number}>
                  <div><span>{item.number}</span><strong>{item.title}</strong></div>
                  <small>{item.detail}</small>
                  {index < projectLayers.length - 1 ? <i aria-hidden="true">↓</i> : null}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="section projects-method-section">
        <div className="shell projects-method-grid">
          <div>
            <p className="kicker kicker-light">Từ dự án đến năng lực dùng lại</p>
            <h2>Không đóng khung ở một mô hình duy nhất</h2>
            <p>Một dự án ứng dụng tốt cần tạo ra được cấu trúc, kinh nghiệm và mô-đun có thể tái sử dụng cho bài toán khác — từ quan trắc, quản lý tài sản đến truy xuất và dữ liệu ngành.</p>
          </div>
          <div className="projects-method-cards">
            <article><span>01</span><strong>Chuẩn hóa kiến trúc</strong><p>Tách các lớp để thay đổi thiết bị, kết nối hoặc ứng dụng mà không phải làm lại toàn bộ hệ thống.</p></article>
            <article><span>02</span><strong>Chuẩn hóa dữ liệu</strong><p>Tổ chức dữ liệu để phục vụ quản lý, báo cáo, phân tích và tích hợp về sau.</p></article>
            <article><span>03</span><strong>Chuẩn hóa chuyển giao</strong><p>Gắn hệ thống với tài liệu, hướng dẫn và đào tạo cho đơn vị tiếp nhận.</p></article>
          </div>
        </div>
      </section>

      <section className="section project-library-section">
        <div className="shell project-library-card">
          <div>
            <p className="kicker">Thư viện dự án</p>
            <h2>Các hồ sơ tiếp theo sẽ được xuất bản theo cùng một cấu trúc</h2>
            <p>Bối cảnh → phạm vi → kiến trúc → công nghệ → triển khai → kết quả được xác minh → media → khả năng nhân rộng.</p>
          </div>
          <div className="project-library-status"><span>Đang cập nhật</span><strong>Hồ sơ dự án đã được kiểm chứng</strong></div>
        </div>
      </section>
    </main>
  );
}
