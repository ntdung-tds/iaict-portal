import type { Metadata } from "next";
import { CategoryLanding } from "@/components/category-landing";
import { productGroups } from "@/lib/public-content";

export const metadata: Metadata = { title: "Sản phẩm & Nền tảng" };

export default function ProductsPage() {
  return <CategoryLanding eyebrow="IAICT Technology" title="Sản phẩm & Nền tảng" intro="Các nhóm sản phẩm được tổ chức theo bài toán ứng dụng; chi tiết từng sản phẩm sẽ được quản trị từ CMS thay vì hard-code trong giao diện." items={productGroups} />;
}
