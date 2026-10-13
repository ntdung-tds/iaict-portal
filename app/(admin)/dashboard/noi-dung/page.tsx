import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { DashboardContentManager, type AdminContentItem } from "../../../../components/admin/dashboard-content-manager";
import { ADMIN_SESSION_COOKIE, validateAdminSession } from "../../../../lib/admin-auth";
import { listReviewTargets } from "../../../../lib/admin-users";
import { bodyFromPublication, getCmsSnapshot } from "../../../../lib/cms-store";

export default async function DashboardContentPage() {
  const cookieStore = await cookies();
  const session = await validateAdminSession(cookieStore.get(ADMIN_SESSION_COOKIE)?.value);
  if (!session) redirect("/admin-login");

  const [snapshot, reviewTargets] = await Promise.all([getCmsSnapshot(), listReviewTargets()]);
  const visibleItems = session.role === "reviewer"
    ? snapshot.state.items.filter((item) => {
        if (item.status === "review" || item.status === "scheduled") return item.reviewerId === session.userId;
        return item.status === "published";
      })
    : snapshot.state.items;

  const items: AdminContentItem[] = visibleItems.map((item) => ({
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
          <span>Biên tập, giao người duyệt, phản hồi, phê duyệt, lên lịch và truy vết phiên bản từ một workflow thống nhất.</span>
        </div>
      </section>

      <DashboardContentManager
        initialItems={items}
        initialRevision={snapshot.state.revision}
        storageReady={snapshot.storageReady}
        materialized={snapshot.materialized}
        currentUser={{
          userId: session.userId,
          username: session.username,
          displayName: session.displayName,
          role: session.role,
        }}
        reviewTargets={reviewTargets.map((user) => ({
          id: user.id,
          username: user.username,
          displayName: user.displayName,
          role: user.role as "reviewer" | "superadmin",
        }))}
      />
    </div>
  );
}
