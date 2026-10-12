import Link from "next/link";
import type { Metadata } from "next";
import { governmentAudiences } from "@/lib/public-content";

export const metadata: Metadata = { title: "Đào tạo dành cho cơ quan nhà nước" };

export default function GovernmentTrainingPage() {
  return (
    <main id="main-content">
      <section className="page-hero page-hero-government"><div className="shell page-hero-inner"><p className="kicker">IAICT Academy / Cơ quan nhà nước</p><h1>Khung đào tạo theo cấp và nhóm vị trí công việc</h1><p className="page-lead">Trang này là lớp giao diện trước M0. Danh mục khóa học, lịch và luồng đề nghị tổ chức lớp sẽ lấy từ CMS sau khi các gate dữ liệu và form được xác nhận.</p></div></section>
      <section className="section"><div className="shell taxonomy-grid">{governmentAudiences.map((item, index) => <article className="taxonomy-card" key={item.title}><span className="taxonomy-index">{String(index + 1).padStart(2, "0")}</span><h2>{item.title}</h2><p>{item.summary}</p></article>)}</div></section>
      <section className="section section-tint"><div className="shell two-panel"><div><p className="kicker">Luồng tương lai</p><h2>Đề nghị tổ chức lớp</h2><p>Luồng chính thức sẽ thu thập cơ quan, đầu mối liên hệ, nhóm chuyên đề, đối tượng, số lượng, địa điểm, thời gian và yêu cầu riêng sau M0.</p></div><div className="safe-state"><strong>Form nghiệp vụ chưa bật</strong><p>Không dùng form giả hoặc lưu dữ liệu ngoài quy trình D1/Turnstile/idempotency.</p><Link className="text-link" href="/lien-he">Trao đổi đầu mối hiện tại →</Link></div></div></section>
    </main>
  );
}
