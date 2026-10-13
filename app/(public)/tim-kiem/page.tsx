import type { Metadata } from "next";
import { SiteSearch } from "@/components/site-search";
import { getPublishedPublications } from "@/lib/cms-store";

export const metadata: Metadata = {
  title: "Tìm kiếm",
  description: "Tìm nhanh sản phẩm, giải pháp, dự án, khóa đào tạo và nội dung công khai trên cổng thông tin IAICT.",
};

export const dynamic = "force-dynamic";

export default async function SearchPage() {
  const publications = await getPublishedPublications();

  return (
    <main id="main-content" className="search-page">
      <section className="search-hero">
        <div className="search-hero-grid" aria-hidden="true"></div>
        <div className="shell search-hero-inner">
          <div>
            <div className="search-breadcrumb"><a href="/">IAICT</a><span>/</span><b>Tìm kiếm</b></div>
            <p className="kicker">Khám phá IAICT</p>
            <h1>Tìm đúng năng lực cho bài toán của bạn</h1>
            <p className="page-lead">Tìm nhanh theo sản phẩm, giải pháp, dự án, đào tạo hoặc chủ đề công nghệ. Kết quả được lập chỉ mục từ các nội dung công khai chính và newsroom đang xuất bản.</p>
          </div>
          <aside className="search-hero-card">
            <span>IAICT Search</span>
            <strong>Một điểm vào cho toàn bộ năng lực công khai</strong>
            <div><b>AI & Dữ liệu</b><b>IoT & Quan trắc</b><b>Chuyển giao</b><b>Đào tạo</b></div>
          </aside>
        </div>
      </section>

      <section className="section search-main-section">
        <div className="shell"><SiteSearch publications={publications} /></div>
      </section>
    </main>
  );
}
