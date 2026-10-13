import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { DashboardUserManager } from "../../../../components/admin/dashboard-user-manager";
import { ADMIN_SESSION_COOKIE, validateAdminSession } from "../../../../lib/admin-auth";
import { listPublicEditorialUsers } from "../../../../lib/admin-users";

export default async function DashboardUsersPage() {
  const store = await cookies();
  const session = await validateAdminSession(store.get(ADMIN_SESSION_COOKIE)?.value);
  if (!session) redirect("/admin-login");
  if (session.role !== "superadmin") redirect("/dashboard");

  const snapshot = await listPublicEditorialUsers();
  return (
    <div className="admin-page">
      <section className="admin-page-head admin-page-head-compact">
        <div>
          <p>Dashboard / Người dùng</p>
          <h1>Người dùng & phân quyền</h1>
          <span>Tạo tài khoản nội bộ, phân vai Biên tập viên – Người duyệt – Quản trị cấp cao và khóa/mở quyền truy cập.</span>
        </div>
      </section>
      <DashboardUserManager initialUsers={snapshot.users} initialRevision={snapshot.state.revision} />
    </div>
  );
}
