import Link from "next/link";
import type { Metadata } from "next";
import { CategoryLanding } from "@/components/category-landing";

const trainingDimensions = [
  { title: "Theo đối tượng", summary: "Phân nhóm lãnh đạo, quản lý, chuyên viên và các nhóm nghiệp vụ." },
  { title: "Theo mục tiêu", summary: "Gắn mục tiêu học tập với năng lực cần áp dụng vào công việc." },
  { title: "Theo module", summary: "Cấu trúc nội dung thành các module có thể tổ chức linh hoạt." },
  { title: "Theo hình thức", summary: "Hỗ trợ các phương án trực tiếp, trực tuyến hoặc kết hợp." },
];

export const metadata: Metadata = { title: "Đào tạo & Tập huấn" };

export default function TrainingPage() {
  return (
    <CategoryLanding eyebrow="IAICT Academy" title="Đào tạo & Tập huấn" intro="Phân hệ đào tạo được thiết kế như một hệ thống nội dung riêng, có đối tượng, mục tiêu, module, thời lượng, hình thức và lịch/session." items={trainingDimensions}>
      <section className="section section-tint">
        <div className="shell government-banner government-banner-light">
          <div><p className="kicker">Landing chuyên biệt</p><h2>Dành cho cơ quan nhà nước</h2><p>Khám phá cách tổ chức chương trình theo cấp quản lý, loại đơn vị và nhóm vị trí công việc.</p></div>
          <Link className="button button-primary" href="/dao-tao-tap-huan/co-quan-nha-nuoc">Xem khung chương trình</Link>
        </div>
      </section>
    </CategoryLanding>
  );
}
