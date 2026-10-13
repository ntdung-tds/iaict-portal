import Link from "next/link";
import type { Metadata } from "next";
import { CategoryLanding } from "@/components/category-landing-v62";

const trainingDimensions = [
  { title: "Theo đối tượng", summary: "Phân nhóm lãnh đạo, quản lý, chuyên viên và các nhóm nghiệp vụ để xác định đúng mức độ và tình huống học tập." },
  { title: "Theo mục tiêu", summary: "Gắn mục tiêu học tập với năng lực cần áp dụng vào công việc thay vì chỉ truyền đạt kiến thức lý thuyết." },
  { title: "Theo module", summary: "Cấu trúc nội dung thành các module có thể kết hợp linh hoạt theo thời lượng, lĩnh vực và trình độ người học." },
  { title: "Theo hình thức", summary: "Tổ chức trực tiếp, trực tuyến hoặc kết hợp; có thể tích hợp thực hành, tình huống và đánh giá đầu ra." },
];

export const metadata: Metadata = {
  title: "Đào tạo & Tập huấn",
  description: "Chương trình đào tạo số, AI, dữ liệu và chuyển đổi số theo đối tượng, nhiệm vụ, module và năng lực đầu ra.",
};

export default function TrainingPage() {
  return (
    <CategoryLanding
      variant="academy"
      eyebrow="IAICT Academy"
      title="Đào tạo & Tập huấn"
      intro="IAICT thiết kế chương trình từ vị trí việc làm, nhiệm vụ và năng lực đầu ra; nội dung được chia thành module để có thể triển khai linh hoạt cho từng nhóm học viên và từng cấp quản lý."
      items={trainingDimensions}
    >
      <section className="section section-tint">
        <div className="shell government-banner government-banner-light">
          <div>
            <p className="kicker">Public Sector Learning</p>
            <h2>Dành cho cơ quan nhà nước</h2>
            <p>Khung chương trình có thể tổ chức theo cấp quản lý, loại đơn vị, nhóm vị trí công việc và mục tiêu chuyển đổi số cụ thể.</p>
          </div>
          <Link className="button button-primary" href="/dao-tao-tap-huan/co-quan-nha-nuoc">
            Xem khung chương trình
          </Link>
        </div>
      </section>
    </CategoryLanding>
  );
}
