import type { Metadata } from "next";
import { CategoryLanding } from "@/components/category-landing-v62";
import { solutionGroups } from "@/lib/public-content";

export const metadata: Metadata = {
  title: "Giải pháp & Dịch vụ",
  description: "Tư vấn, thiết kế, AI & dữ liệu, IoT, phần mềm, tích hợp và hỗ trợ vận hành theo bài toán thực tế.",
};

export default function SolutionsPage() {
  return (
    <CategoryLanding
      variant="solutions"
      eyebrow="IAICT Solutions"
      title="Giải pháp & Dịch vụ"
      intro="IAICT bắt đầu từ bài toán vận hành, dữ liệu và tiêu chí thành công; sau đó mới lựa chọn kiến trúc, công nghệ và lộ trình triển khai phù hợp."
      items={solutionGroups}
    />
  );
}
