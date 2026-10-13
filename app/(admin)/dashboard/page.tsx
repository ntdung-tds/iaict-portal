import Link from "next/link";
import { getCmsSnapshot, toPublicPublication } from "../../../lib/cms-store";
import { getPublicationTypeLabel } from "../../../lib/publications";
import { formatPublicationDate } from "../../../lib/publication-date";

export default async function DashboardPage() {
  const snapshot = await getCmsSnapshot();
  const published = snapshot.state.items
    .filter((item) => item.status === "published")
    .map((item) => toPublicPublication(item))
    .sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));
  const drafts = snapshot.state.items.filter((item) => item.status === "draft");
  const eventCount = published.filter((item) => item.type === "event").length;
  const noticeCount = published.filter((item) => item.type === "notice").length;
  const featured = published.find((item) => item.featured) ?? published[0];

  return (
    <div className="admin-page">
      <section className="admin-page-head">
        <div>
          <p>Dashboard / Tổng quan</p>
          <h1>Trung tâm điều phối nội dung IAICT</h1>
          <span>Theo dõi nội dung công khai, bản nháp, workflow biên tập và trạng thái kho CMS tập trung.</span>
        </div>
        <div className="admin-page-actions">
          <Link className="admin-button admin-button-secondary" href="/">Xem website</Link>
          <Link className="admin-button admin-button-primary" href="/dashboard/noi-dung">Quản lý nội dung</Link>
        </div>
      </section>

      <section className="admin-preview-warning" role="status">
        <div>
          <span>{snapshot.storageReady ? "CMS STORAGE ONLINE" : "CMS STORAGE OFFLINE"}</span>
          <strong>{snapshot.storageReady ? "Dashboard đã kết nối kho nội dung bền vững trên Vercel Blob." : "Kho lưu trữ CMS chưa được cấu hình."}</strong>
        </div>
        <p>
          {snapshot.materialized
            ? `Dữ liệu CMS đang ở revision ${snapshot.state.revision}. Newsroom công khai đọc trực tiếp từ cùng nguồn dữ liệu.`
            : "Kho Blob đã sẵn sàng; dữ liệu nền từ repository sẽ được materialize vào CMS khi có thay đổi đầu tiên."}
        </p>
      </section>

      <section className="admin-metric-grid" aria-label="Tổng quan nội dung">
        <article className="admin-metric-card admin-metric-card-primary">
          <span>01 / Published</span><strong>{published.length}</strong><p>Nội dung đang xuất bản</p><i>Public newsroom</i>
        </article>
        <article className="admin-metric-card">
          <span>02 / Drafts</span><strong>{drafts.length}</strong><p>Bản nháp trong CMS</p><i>Chưa công khai</i>
        </article>
        <article className="admin-metric-card">
          <span>03 / Events</span><strong>{eventCount}</strong><p>Sự kiện đã xuất bản</p><i>Verified schedule only</i>
        </article>
        <article className="admin-metric-card">
          <span>04 / Notices</span><strong>{noticeCount}</strong><p>Thông báo công khai</p><i>IAICT notices</i>
        </article>
      </section>

      <section className="admin-grid admin-grid-main">
        <div className="admin-panel admin-panel-content">
          <div className="admin-panel-head">
            <div><span>Nội dung gần đây</span><h2>Newsroom</h2></div>
            <Link href="/dashboard/noi-dung">Xem toàn bộ →</Link>
          </div>
          <div className="admin-content-list">
            {published.slice(0, 5).map((item, index) => (
              <article key={item.slug}>
                <b>{String(index + 1).padStart(2, "0")}</b>
                <div>
                  <span>{getPublicationTypeLabel(item.type)} · {formatPublicationDate(item.publishedAt)}</span>
                  <strong>{item.title}</strong>
                  <small>{item.category}</small>
                </div>
                <Link href={`/tin-tuc/${item.slug}`} aria-label={`Mở ${item.title}`}>↗</Link>
              </article>
            ))}
          </div>
        </div>

        <aside className="admin-panel admin-featured-panel">
          <div className="admin-panel-head compact"><div><span>Featured</span><h2>Nội dung nổi bật</h2></div></div>
          {featured ? (
            <div className="admin-featured-card">
              <span>{featured.category}</span><strong>{featured.title}</strong><p>{featured.excerpt}</p>
              <Link href={`/tin-tuc/${featured.slug}`}>Mở bài viết →</Link>
            </div>
          ) : <div className="admin-featured-card"><strong>Chưa có nội dung nổi bật</strong></div>}
        </aside>
      </section>

      <section className="admin-grid admin-grid-workflow">
        <div className="admin-panel">
          <div className="admin-panel-head compact"><div><span>Editorial workflow</span><h2>Luồng biên tập</h2></div></div>
          <div className="admin-workflow">
            <div><b>01</b><strong>Nháp</strong><span>Biên tập nội dung và metadata</span></div><i aria-hidden="true">→</i>
            <div><b>02</b><strong>Rà soát</strong><span>Kiểm chứng nguồn và phạm vi công khai</span></div><i aria-hidden="true">→</i>
            <div><b>03</b><strong>Xuất bản</strong><span>Đưa bài ra newsroom và chỉ mục</span></div><i aria-hidden="true">→</i>
            <div><b>04</b><strong>Gỡ / cập nhật</strong><span>Quản lý vòng đời nội dung</span></div>
          </div>
        </div>

        <aside className="admin-panel admin-infra-panel">
          <div className="admin-panel-head compact"><div><span>CMS readiness</span><h2>Trạng thái hạ tầng</h2></div></div>
          <div className="admin-infra-list">
            <div><span>Xác thực quản trị</span><b className="is-live">Đang hoạt động</b></div>
            <div><span>Kho nội dung Vercel Blob</span><b className={snapshot.storageReady ? "is-live" : "is-pending"}>{snapshot.storageReady ? "Đang hoạt động" : "Chưa kết nối"}</b></div>
            <div><span>Audit log nội dung</span><b className="is-live">Đang hoạt động</b></div>
            <div><span>Thư viện Media</span><b className="is-live">Đang hoạt động</b></div>
          </div>
        </aside>
      </section>
    </div>
  );
}
