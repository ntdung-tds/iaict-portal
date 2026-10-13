import { DashboardContentManager } from "../../../../components/admin/dashboard-content-manager";
import { publications } from "../../../../lib/publications";

export default function DashboardContentPage() {
  const items = publications.map((item) => ({
    slug: item.slug,
    title: item.title,
    category: item.category,
    type: item.type,
    publishedAt: item.publishedAt,
    excerpt: item.excerpt,
    keywords: item.keywords,
    featured: Boolean(item.featured),
    status: "published" as const,
  }));

  return (
    <div className="admin-page">
      <section className="admin-page-head admin-page-head-compact">
        <div>
          <p>Dashboard / Nội dung</p>
          <h1>Quản lý nội dung</h1>
          <span>Tìm kiếm, lọc và biên tập newsroom từ một không gian thống nhất.</span>
        </div>
      </section>

      <DashboardContentManager initialItems={items} />
    </div>
  );
}
