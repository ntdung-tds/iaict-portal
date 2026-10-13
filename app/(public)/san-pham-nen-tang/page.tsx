import type { Metadata } from "next";
import { CategoryLanding } from "@/components/category-landing";
import { productGroups } from "@/lib/public-content";

export const metadata: Metadata = {
  title: "Sản phẩm & Nền tảng",
  description: "Các lớp công nghệ IAICT từ IoT, dữ liệu và AI đến truy xuất, quản lý vòng đời và ứng dụng nghiệp vụ.",
};

export default function ProductsPage() {
  return (
    <CategoryLanding
      variant="technology"
      eyebrow="IAICT Technology"
      title="Sản phẩm & Nền tảng"
      intro="Các nhóm công nghệ được tổ chức theo lớp năng lực có thể tích hợp: từ thiết bị và dữ liệu hiện trường đến AI, ứng dụng nghiệp vụ, truy xuất và quản lý vòng đời."
      items={productGroups}
    />
  );
}
