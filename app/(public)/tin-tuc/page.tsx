import type { Metadata } from "next";
import { DataPlaceholder } from "@/components/data-placeholder";
import { newsCategories } from "@/lib/public-content";

export const metadata: Metadata = { title: "Tin tức" };

export default function NewsPage() {
  return (
    <main id="main-content"><section className="page-hero"><div className="shell page-hero-inner"><p className="kicker">Tin tức</p><h1>Kênh thông tin chính thức của IAICT</h1><p className="page-lead">Tin tức được tổ chức theo chuyên mục rõ ràng nhưng không lấn át các trụ cột sản phẩm, giải pháp và đào tạo.</p></div></section><section className="section"><div className="shell"><div className="chip-cloud" aria-label="Chuyên mục tin tức">{newsCategories.map((item) => <span key={item}>{item}</span>)}</div><div className="news-placeholder-grid spaced-top"><DataPlaceholder label="CMS / Articles" title="Danh sách bài viết đang chờ dữ liệu" description="Listing sẽ có loading, empty, error và success state khi kết nối CMS." /><DataPlaceholder label="CMS / Events" title="Sự kiện – Hội thảo" description="Sự kiện là nội dung có cấu trúc và sẽ được xuất bản theo trạng thái." /></div></div></section></main>
  );
}
