import Link from "next/link";
import { getPublicationTypeLabel, publications } from "../../../lib/publications";
import { formatPublicationDate } from "../../../lib/publication-date";

const publishedCount = publications.length;
const eventCount = publications.filter((item) => item.type === "event").length;
const noticeCount = publications.filter((item) => item.type === "notice").length;
const featured = publications.find((item) => item.featured) ?? publications[0];

export default function DashboardPage() {
  return (
    <div className="admin-page">
      <section className="admin-page-head">
        <div>
          <p>Dashboard / Tổng quan</p>
          <h1>Trung tâm điều phối nội dung IAICT</h1>
          <span>
            Theo dõi kho nội dung công khai, workflow biên tập và mức sẵn sàng của hạ tầng CMS trước khi đưa vào vận hành thật.
          </span>
        </div>
        <div className="admin-page-actions">
          <Link className="admin-button admin-button-secondary" href="/">
            Xem website
          </Link>
          <Link className="admin-button admin-button-primary" href="/dashboard/noi-dung">
            Quản lý nội dung
          </Link>
        </div>
      </section>

      <section className="admin-preview-warning" role="status">
        <div>
          <span>SECURITY ONLINE</span>
          <strong>Dashboard đã được bảo vệ bằng đăng nhập và session ký số.</strong>
        </div>
        <p>
          Nội dung công khai hiện vẫn lấy từ repository. Bản nháp trong trình biên tập tiếp tục lưu cục bộ cho đến khi persistence adapter được kết nối với kho dữ liệu thật.
        </p>
      </section>

      <section className="admin-metric-grid" aria-label="Tổng quan nội dung">
        <article className="admin-metric-card admin-metric-card-primary">
          <span>01 / Published</span>
          <strong>{publishedCount}</strong>
          <p>Nội dung đang xuất bản</p>
          <i>Public newsroom</i>
        </article>
        <article className="admin-metric-card">
          <span>02 / Events</span>
          <strong>{eventCount}</strong>
          <p>Sự kiện đã xác nhận</p>
          <i>Chưa có lịch công khai</i>
        </article>
        <article className="admin-metric-card">
          <span>03 / Notices</span>
          <strong>{noticeCount}</strong>
          <p>Thông báo đang công khai</p>
          <i>IAICT notices</i>
        </article>
        <article className="admin-metric-card">
          <span>04 / Projects</span>
          <strong>1</strong>
          <p>Dự án nổi bật đang hiển thị</p>
          <i>Trâm Rừng</i>
        </article>
      </section>

      <section className="admin-grid admin-grid-main">
        <div className="admin-panel admin-panel-content">
          <div className="admin-panel-head">
            <div>
              <span>Nội dung gần đây</span>
              <h2>Newsroom</h2>
            </div>
            <Link href="/dashboard/noi-dung">Xem toàn bộ →</Link>
          </div>
          <div className="admin-content-list">
            {publications.slice(0, 5).map((item, index) => (
              <article key={item.slug}>
                <b>{String(index + 1).padStart(2, "0")}</b>
                <div>
                  <span>
                    {getPublicationTypeLabel(item.type)} · {formatPublicationDate(item.publishedAt)}
                  </span>
                  <strong>{item.title}</strong>
                  <small>{item.category}</small>
                </div>
                <Link href={`/tin-tuc/${item.slug}`} aria-label={`Mở ${item.title}`}>
                  ↗
                </Link>
              </article>
            ))}
          </div>
        </div>

        <aside className="admin-panel admin-featured-panel">
          <div className="admin-panel-head compact">
            <div>
              <span>Featured</span>
              <h2>Nội dung nổi bật</h2>
            </div>
          </div>
          <div className="admin-featured-card">
            <span>{featured.category}</span>
            <strong>{featured.title}</strong>
            <p>{featured.excerpt}</p>
            <Link href={`/tin-tuc/${featured.slug}`}>Mở bài viết →</Link>
          </div>
        </aside>
      </section>

      <section className="admin-grid admin-grid-workflow">
        <div className="admin-panel">
          <div className="admin-panel-head compact">
            <div>
              <span>Editorial workflow</span>
              <h2>Luồng biên tập mục tiêu</h2>
            </div>
          </div>
          <div className="admin-workflow">
            <div>
              <b>01</b>
              <strong>Nháp</strong>
              <span>Biên tập nội dung và metadata</span>
            </div>
            <i aria-hidden="true">→</i>
            <div>
              <b>02</b>
              <strong>Rà soát</strong>
              <span>Kiểm chứng nguồn và phạm vi công khai</span>
            </div>
            <i aria-hidden="true">→</i>
            <div>
              <b>03</b>
              <strong>Đã duyệt</strong>
              <span>Chốt nội dung, ảnh và lịch xuất bản</span>
            </div>
            <i aria-hidden="true">→</i>
            <div>
              <b>04</b>
              <strong>Xuất bản</strong>
              <span>Đưa ra website và cập nhật chỉ mục</span>
            </div>
          </div>
        </div>

        <aside className="admin-panel admin-infra-panel">
          <div className="admin-panel-head compact">
            <div>
              <span>CMS readiness</span>
              <h2>Trạng thái hạ tầng</h2>
            </div>
          </div>
          <div className="admin-infra-list">
            <div>
              <span>Xác thực quản trị</span>
              <b className="is-live">Đang hoạt động</b>
            </div>
            <div>
              <span>Database nội dung</span>
              <b className="is-pending">Chờ kết nối</b>
            </div>
            <div>
              <span>Thư viện media</span>
              <b className="is-pending">Chờ kết nối</b>
            </div>
            <div>
              <span>Publications adapter</span>
              <b className="is-live">Đang hoạt động</b>
            </div>
          </div>
        </aside>
      </section>
    </div>
  );
}
