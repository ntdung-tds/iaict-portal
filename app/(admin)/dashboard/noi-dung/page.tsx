import { DashboardContentManager, type AdminContentItem } from "../../../../components/admin/dashboard-content-manager";
import { bodyFromPublication, getCmsSnapshot } from "../../../../lib/cms-store";

export default async function DashboardContentPage() {
  const snapshot = await getCmsSnapshot();
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
          <span>Tạo nháp, biên tập, xuất bản và gỡ nội dung từ kho CMS tập trung.</span>
        </div>
      </section>

      <DashboardContentManager
        initialItems={items}
        initialRevision={snapshot.state.revision}
        storageReady={snapshot.storageReady}
        materialized={snapshot.materialized}
      />
    </div>
  );
}
