import type { Metadata } from "next";
import { CategoryLanding } from "@/components/category-landing-v62";
import { transferSteps } from "@/lib/public-content";

export const metadata: Metadata = {
  title: "Chuyển giao công nghệ",
  description: "Quy trình từ khảo sát, thử nghiệm và hoàn thiện đến bàn giao, tài liệu hóa, đào tạo và đồng hành sau tiếp nhận.",
};

export default function TransferPage() {
  return (
    <CategoryLanding
      variant="transfer"
      eyebrow="IAICT Transfer"
      title="Chuyển giao công nghệ"
      intro="IAICT xem chuyển giao là quá trình biến một giải pháp đã được kiểm chứng thành năng lực mà đơn vị tiếp nhận có thể hiểu, vận hành, bảo trì và phát triển tiếp."
      items={transferSteps}
    />
  );
}
