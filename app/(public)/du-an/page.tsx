import type { Metadata } from "next";
import { DataPlaceholder } from "@/components/data-placeholder";

export const metadata: Metadata = { title: "Dự án tiêu biểu" };

export default function ProjectsPage() {
  return (
    <main id="main-content"><section className="page-hero"><div className="shell page-hero-inner"><p className="kicker">Dự án tiêu biểu</p><h1>Mô hình ứng dụng và khả năng nhân rộng</h1><p className="page-lead">Dự án sẽ được trình bày theo bối cảnh, giải pháp, phạm vi, công nghệ, kết quả, media và khả năng nhân rộng.</p></div></section><section className="section"><div className="shell news-placeholder-grid"><DataPlaceholder label="CMS / Projects" title="Chưa hard-code dự án" description="Danh sách sẽ lấy từ thực thể Project đã được biên tập và xuất bản." /><DataPlaceholder label="Evidence-first" title="Không công bố kết quả chưa xác minh" description="Số liệu, media và case study phải có nguồn nội bộ được phê duyệt." /></div></section></main>
  );
}
