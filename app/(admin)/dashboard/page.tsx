import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ADMIN_SESSION_COOKIE, validateAdminSession } from "../../../lib/admin-auth";
import { getNotificationInbox } from "../../../lib/admin-notifications";
import { getCmsSnapshot, isPublicationPublic, toPublicPublication } from "../../../lib/cms-store";
import { getPublicationTypeLabel } from "../../../lib/publications";
import { formatPublicationDate } from "../../../lib/publication-date";

function notificationKindLabel(kind: "review-request" | "returned" | "scheduled" | "published" | "comment" | "upcoming") {
  if (kind === "review-request") return "Duyệt bài";
  if (kind === "returned") return "Trả lại";
  if (kind === "scheduled") return "Đã lên lịch";
  if (kind === "published") return "Đã xuất bản";
  if (kind === "comment") return "Phản hồi";
  return "Sắp xuất bản";
}

export default async function DashboardPage() {
  const cookieStore = await cookies();
  const session = await validateAdminSession(cookieStore.get(ADMIN_SESSION_COOKIE)?.value);
  if (!session) redirect("/admin-login");

  const [snapshot, inbox] = await Promise.all([getCmsSnapshot(), getNotificationInbox(session)]);
  const publicItems = snapshot.state.items
    .filter((item) => isPublicationPublic(item))
    .map((item) => toPublicPublication(item))
    .sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));
  const drafts = snapshot.state.items.filter((item) => item.status === "draft");
  const review = snapshot.state.items.filter((item) => item.status === "review");
  const scheduled = snapshot.state.items.filter((item) => item.status === "scheduled");
  const featured = publicItems.find((item) => item.featured) ?? publicItems[0];
  const inboxPreview = inbox.items.filter((item) => item.unread || item.level !== "info").slice(0, 3);

  return (
    <div className="admin-page">
      <section className="admin-page-head">
        <div>
          <p>Dashboard / Tổng quan</p>
          <h1>Trung tâm điều phối nội dung IAICT</h1>
          <span>Theo dõi nội dung công khai, bản nháp, chờ duyệt, lịch xuất bản và trạng thái kho CMS tập trung.</span>
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
          <span>01 / Public</span><strong>{publicItems.length}</strong><p>Nội dung đang công khai</p><i>Newsroom & search</i>
        </article>
        <article className="admin-metric-card">
          <span>02 / Review</span><strong>{review.length}</strong><p>Nội dung chờ duyệt</p><i>Editorial review</i>
        </article>
        <article className="admin-metric-card">
          <span>03 / Scheduled</span><strong>{scheduled.length}</strong><p>Nội dung đã lên lịch</p><i>Automatic publishing</i>
        </article>
        <article className="admin-metric-card">
          <span>04 / Drafts</span><strong>{drafts.length}</strong><p>Bản nháp trong CMS</p><i>Chưa công khai</i>
        </article>
      </section>

      <section className="admin-dashboard-inbox">
        <div className="admin-dashboard-inbox-head">
          <div><span>Personal work queue</span><h2>Hộp công việc · {inbox.unreadCount} chưa đọc</h2></div>
          <Link href="/dashboard/thong-bao">Mở hộp việc →</Link>
        </div>
        {inboxPreview.length ? (
          <div className="admin-dashboard-inbox-list">
            {inboxPreview.map((item) => (
              <Link href={item.href} key={item.id}>
                <span>{notificationKindLabel(item.kind)}{item.unread ? " · Mới" : ""}</span>
                <strong>{item.publicationTitle}</strong>
                <p>{item.title}</p>
              </Link>
            ))}
          </div>
        ) : (
          <div className="admin-notification-empty">
            <span>✓</span><strong>Hiện không có việc cần chú ý</strong><p>Workflow mới sẽ tự xuất hiện tại đây.</p>
          </div>
        )}
      </section>

      <section className="admin-grid admin-grid-main">
        <div className="admin-panel admin-panel-content">
          <div className="admin-panel-head">
            <div><span>Nội dung gần đây</span><h2>Newsroom</h2></div>
            <Link href="/dashboard/noi-dung">Xem toàn bộ →</Link>
          </div>
          <div className="admin-content-list">
            {publicItems.slice(0, 5).map((item, index) => (
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
            <div><b>01</b><strong>Nháp</strong><span>Biên tập nội dung, ảnh và metadata</span></div><i aria-hidden="true">→</i>
            <div><b>02</b><strong>Xem trước</strong><span>Kiểm tra bố cục trước khi công khai</span></div><i aria-hidden="true">→</i>
            <div><b>03</b><strong>Chờ duyệt</strong><span>Rà soát nội dung và phạm vi công khai</span></div><i aria-hidden="true">→</i>
            <div><b>04</b><strong>Lên lịch / Xuất bản</strong><span>Đưa bài ra newsroom đúng thời điểm</span></div>
          </div>
        </div>

        <aside className="admin-panel admin-infra-panel">
          <div className="admin-panel-head compact"><div><span>CMS readiness</span><h2>Trạng thái hạ tầng</h2></div></div>
          <div className="admin-infra-list">
            <div><span>Xác thực quản trị</span><b className="is-live">Đang hoạt động</b></div>
            <div><span>Kho nội dung Vercel Blob</span><b className={snapshot.storageReady ? "is-live" : "is-pending"}>{snapshot.storageReady ? "Đang hoạt động" : "Chưa kết nối"}</b></div>
            <div><span>Workflow & lịch xuất bản</span><b className="is-live">Đang hoạt động</b></div>
            <div><span>Thông báo & hộp việc</span><b className="is-live">Đang hoạt động</b></div>
            <div><span>Thư viện Media</span><b className="is-live">Đang hoạt động</b></div>
          </div>
        </aside>
      </section>
    </div>
  );
}
