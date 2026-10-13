import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { NotificationCenter } from "@/components/admin/notification-center";
import { ADMIN_SESSION_COOKIE, validateAdminSession } from "@/lib/admin-auth";
import { getNotificationInbox } from "@/lib/admin-notifications";

export default async function DashboardNotificationsPage() {
  const cookieStore = await cookies();
  const session = await validateAdminSession(cookieStore.get(ADMIN_SESSION_COOKIE)?.value);
  if (!session) redirect("/admin-login");

  const inbox = await getNotificationInbox(session);

  return (
    <div className="admin-page">
      <section className="admin-page-head admin-page-head-compact">
        <div>
          <p>Dashboard / Hộp công việc</p>
          <h1>Thông báo & việc cần xử lý</h1>
          <span>Gom các bài chờ duyệt, bài bị trả lại, lịch sắp chạy và phản hồi workflow theo đúng tài khoản hiện tại.</span>
        </div>
        <div className="admin-notification-head-stats">
          <div><span>Chưa đọc</span><strong>{inbox.unreadCount}</strong></div>
          <div><span>Cần xử lý</span><strong>{inbox.actionCount}</strong></div>
        </div>
      </section>

      <section className="admin-notification-principle">
        <div><span>LIVE WORK QUEUE</span><strong>Thông báo được suy ra trực tiếp từ workflow CMS</strong></div>
        <p>Hệ thống không sao chép trạng thái bài viết sang một kho việc riêng. Vì vậy khi bài được duyệt, trả lại hoặc xuất bản, hộp việc tự phản ánh trạng thái mới; chỉ trạng thái đã đọc được lưu riêng cho từng người dùng.</p>
      </section>

      <NotificationCenter initialItems={inbox.items} />
    </div>
  );
}
