import { cookies } from "next/headers";
import { DashboardContentManager, type AdminContentItem } from "../../../../components/admin/dashboard-content-manager";
import { ADMIN_SESSION_COOKIE, verifyAdminSession } from "../../../../lib/admin-auth";
import { bodyFromPublication, getCmsSnapshot } from "../../../../lib/cms-store";

export default async function DashboardContentPage() {
  const [snapshot, cookieStore] = await Promise.all([getCmsSnapshot(), cookies()]);
  const session = verifyAdminSession(cookieStore.get(ADMIN_SESSION_COOKIE)?.value);
  const items: AdminContentItem[] = snapshot.state.items.map((item) => ({
    ...item,
    featured: Boolean(item.featured),
    body: bodyFromPublication(item),
  }));

  return (
    <div className="admin-page">
      <section className="admin-page-head admin-page-head-compact">
        <div>
          <p>Dashboard / Nội dung</p>
          <h1>Quản lý nội dung</h1>
          <span>Biên tập, phản hồi, phê duyệt, lên lịch và truy vết phiên bản từ một workflow thống nhất.</span>
        </div>
      </section>

      <DashboardContentManager
        initialItems={items}
        initialRevision={snapshot.state.revision}
        storageReady={snapshot.storageReady}
        materialized={snapshot.materialized}
        currentUser={{
          username: session?.username ?? "admin",
          role: session?.role ?? "superadmin",
        }}
      />
    </div>
  );
}
